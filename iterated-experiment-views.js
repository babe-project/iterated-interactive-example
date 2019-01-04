const iteratedExperimentViews = {
    init: function(config) {
        const _init = {
            name: config.name,
            title: config.title,
            text: config.text || "Initializing the experiment...",
            render: function(CT, babe) {
                const viewTemplate = `
                        <div class="babe-view">
                            <h1 class="babe-view-title">${this.title}</h1>
                            <section class="babe-text-container">
                                <p class="babe-view-text">${this.text}</p>
                            </section>
                        </div>
                `;

                $("#main").html(viewTemplate);

                // Hopefully by telling them upfront they will stop the HIT before ever taking it.
                babe.onSocketError = function(reasons) {
                    window.alert(
                        `Sorry, a connection to our server couldn't be established. You may want to wait and try again. If the error persists, do not proceed with the HIT. Thank you for your understanding. Error: ${reasons}`
                    );
                };

                babe.onSocketTimeout = function() {
                    window.alert(
                        `Sorry, the connection to our server timed out. You may want to wait and try again. If the error persists, do not proceed with the HIT. Thank you for your understanding. `
                    );
                };

                // Generate a unique ID for each participant.
                babe.participant_id = iteratedExperimentUtils.generateId(40);

                // Create a new socket
                // Documentation at: https://hexdocs.pm/phoenix/js/
                babe.socket = new Phoenix.Socket(babe.deploy.socketURL, {
                    params: {
                        participant_id: babe.participant_id,
                        experiment_id: babe.deploy.experimentID
                    }
                });

                // Set up what to do when the whole socket connection crashes/fails.
                babe.socket.onError(() =>
                    babe.onSocketError(
                        "The connection to the server was dropped."
                    )
                );

                // Not really useful. This will only be invoked when the connection is explicitly closed by either the server or the client.
                // babe.socket.onClose( () => console.log("Connection closed"));

                // Try to connect to the server.
                babe.socket.connect();

                // First join the participant channel belonging only to this participant.
                babe.participantChannel = babe.socket.channel(
                    `participant:${babe.participant_id}`,
                    {}
                );

                babe.participantChannel.on(
                    "experiment_available",
                    (payload) => {
                        // First record the assigned <variant-nr, chain-nr, realization-nr> tuple.
                        babe.variant = payload.variant;
                        babe.chain = payload.chain;
                        babe.realization = payload.realization;
                        // Proceed to the next view if the connection to the participant channel was successfully established.
                        babe.findNextView();
                    }
                );

                babe.participantChannel
                    .join()
                    // Note that `receive` functions are for receiving a *reply* from the server after you try to send it something, e.g. `join()` or `push()`.
                    // While `on` function is for passively listening for new messages initiated by the server.
                    .receive("ok", (payload) => {
                        // We still need to wait for the actual confirmation message of "experiment_available". So we do nothing here.
                    })
                    .receive("error", (reasons) => {
                        babe.onSocketError(reasons);
                    })
                    .receive("timeout", () => {
                        babe.onSocketTimeout();
                    });
            },
            CT: 0,
            trials: config.trials
        };
        return _init;
    },
    iteratedExperimentLobby: function(config) {
        const _lobby = {
            name: config.name,
            title: config.title,
            text: config.text || "Connecting to the server...",
            render: function(CT, babe) {
                const viewTemplate = `
                    <div class="babe-view">
                        <h1 class="babe-view-title">${this.title}</h1>
                        <section class="babe-text-container">
                            <p id="lobby-text" class="babe-view-text">${
                                this.text
                            }</p>
                        </section>
                    </div>
                `;

                $("#main").html(viewTemplate);

                // If this participant is one of the first generation, there should be no need to wait on any results.
                if (babe.realization == 1) {
                    // Apparently you can't call babe.findNextView too soon, otherwise it will just try to render the same view over and over again.
                    setTimeout(babe.findNextView, 1000);
                } else {
                    // realization - 1 because we're waiting on the results of the last iteration.
                    // by specifying a different experimentID we can also wait on results from other experiments.
                    babe.lobbyChannel = babe.socket.channel(
                        `iterated_lobby:${babe.deploy.experimentID}:${
                            babe.variant
                        }:${babe.chain}:${babe.realization - 1}`,
                        { participant_id: babe.participant_id }
                    );

                    // Whenever the waited-on results are submitted (i.e. assignment finished) on the server, this participant will get the results.
                    babe.lobbyChannel.on("finished", (payload) => {
                        babe.lastIterationResults = payload.results;
                        // We're no longer waiting on that assignment if we already got its results.
                        babe.lobbyChannel.leave();
                        babe.findNextView();
                    });

                    // Check whether the interactive experiment can be started.
                    babe.lobbyChannel
                        .join()
                        .receive("ok", (msg) => {
                            document.getElementById(
                                "lobby-text"
                            ).innerHTML = `<p class="babe-view-text">Successfully joined the lobby. Waiting for the server...</p>
                                
                                <p class="babe-view-text">Assignment trituple: &lt;variant: ${
                                    babe.variant
                                }, chain: ${babe.chain}, realization: ${
                                babe.realization
                            }&gt;</p>
                                `;
                        })
                        .receive("error", (reasons) => {
                            babe.onSocketError(reasons);
                        })
                        .receive("timeout", () => {
                            babe.onSocketTimeout();
                        });
                }
            },
            CT: 0,
            trials: config.trials
        };

        return _lobby;
    },

    trialView: function(config) {
        const _trial = {
            name: config.name,
            title: config.title,
            render: function(CT, babe) {
                let startingTime;

                const viewTemplate = `
                        <p class="babe-view">
                            <h1 class="babe-view-title">${this.title}</h1>
                                <p class="babe-view-text">Assignment trituple: &lt;variant: ${
                                    babe.variant
                                }, chain: ${babe.chain}, realization: ${
                    babe.realization
                }&gt;</p>
                                <p id="text-description" class="babe-view-text">
                                    The following is what the participant of the same chain in the last iteration wrote:
                                </p>
                                <p id="text-last-iteration" class="babe-view-text">                               
                                </p>
                            <div class="babe-view-answer-container">
                                <textarea name="textbox-input" id="text-this-iteration" class='babe-response-text' cols="50" rows="20"></textarea>
                            </div>
                                <p class="babe-view-text">
                                    Write something before you click "next". It will be shown to the participant of the same chain in the next iteration.
                                </p>
                            <button id='next' class='babe-view-button'>next</button>
                        </div>
                `;

                $("#main").html(viewTemplate);

                if (babe.realization == 1) {
                    $("#text-description").hide();
                    document.getElementById("text-last-iteration").innerText = `
                        This is the first iteration. Write whatever you want here.
                    `;
                } else {
                    let prevText = babe.lastIterationResults[0]["response"];
                    document.getElementById(
                        "text-last-iteration"
                    ).innerText = prevText;
                }

                let next = $("#next");
                let textInput = $("textarea");
                next.on("click", function() {
                    var RT = Date.now() - startingTime; // measure RT before anything else
                    var trial_data = {
                        trial_type: config.trial_type,
                        trial_number: CT + 1,
                        response: textInput.val().trim(),
                        RT: RT
                    };

                    babe.trial_data.push(trial_data);
                    babe.findNextView();
                });
                startingTime = Date.now();
            },
            CT: 0,
            trials: config.trials
        };
        return _trial;
    },

    thanksWithSocket: function(config) {
        const _thanks = {
            name: config.name,
            title: babeUtils.view.setter.title(
                config.title,
                "Thank you for taking part in this experiment!"
            ),
            prolificConfirmText: babeUtils.view.setter.prolificConfirmText(
                config.prolificConfirmText,
                "Please press the button below to confirm that you completed the experiment with Prolific"
            ),
            render: function(CT, babe) {
                if (
                    babe.deploy.is_MTurk ||
                    babe.deploy.deployMethod === "directLink"
                ) {
                    // updates the fields in the hidden form with info for the MTurk's server
                    $("#main").html(
                        `<div class='babe-view babe-thanks-view'>
                            <h2 id='warning-message' class='babe-warning'>Submitting the data
                                <p class='babe-view-text'>please do not close the tab</p>
                                <div class='babe-loader'></div>
                            </h2>
                            <h1 id='thanks-message' class='babe-thanks babe-nodisplay'>${
                                this.title
                            }</h1>
                        </div>`
                    );
                } else if (babe.deploy.deployMethod === "Prolific") {
                    $("#main").html(
                        `<div class='babe-view babe-thanks-view'>
                            <h2 id='warning-message' class='babe-warning'>Submitting the data
                                <p class='babe-view-text'>please do not close the tab</p>
                                <div class='babe-loader'></div>
                            </h2>
                            <h1 id='thanks-message' class='babe-thanks babe-nodisplay'>${
                                this.title
                            }</h1>
                            <p id='extra-message' class='babe-view-text babe-nodisplay'>
                                ${this.prolificConfirmText}
                                <a href="${
                                    babe.deploy.prolificURL
                                }" class="babe-view-button prolific-url">Confirm</a>
                            </p>
                        </div>`
                    );
                } else if (babe.deploy.deployMethod === "debug") {
                    $("main").html(
                        `<div id='babe-debug-table-container' class='babe-view babe-thanks-view'>
                            <h1 class='babe-view-title'>Debug Mode</h1>
                        </div>`
                    );
                } else {
                    console.error("No such babe.deploy.deployMethod");
                }

                babe.submission = iteratedExperimentUtils.babeSubmitWithSocket(
                    babe
                );
                babe.submission.submit(babe);
            },
            CT: 0,
            trials: 1
        };
        return _thanks;
    }
};
