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
                        console.log(`variant: ${babe.variant}, chain: ${babe.chain}, realization: ${babe.realization}`);
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
        const _lobby_iterated = {
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

        return _lobby_iterated;
    },
    interactiveExperimentLobby: function(config) {
        const _lobby_interactive = {
            name: config.name,
            title: config.title,
            text: config.text || "Connecting to the server...",
            number_players: config.number_players,
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

                // This channel will be used for all subsequent group communications in this one experiment.
                babe.gameChannel = babe.socket.channel(
                    `interactive_room:${babe.deploy.experimentID}:${
                        babe.chain
                    }:${babe.realization}`,
                    { participant_id: babe.participant_id }
                );

                // We don't really need to track the presence on the client side for now.
                // babe.lobbyPresence = new Phoenix.Presence(babe.gameChannel);

                babe.gameChannel
                    .join()
                    .receive("ok", (msg) => {
                        document.getElementById("lobby-text").innerHTML =
                            "Successfully joined the lobby. Waiting for other participants...";
                    })
                    .receive("error", (reasons) => {
                        babe.onSocketError(reasons);
                    })
                    .receive("timeout", () => {
                        babe.onSocketTimeout();
                    });


                let saveTrialData = function(prev_round_trial_data) {
                    // These could be different for each participant, thus they fill them in before recording them.
                    prev_round_trial_data["variant"] = babe.variant;
                    prev_round_trial_data["chain"] = babe.chain;
                    prev_round_trial_data["realization"] = babe.realization;

                    babe.trial_data.push(prev_round_trial_data);
                };

                // When the server tells the participant it's time to start the game with the "start_game" message (e.g. when there are enough participants for the game already for this game), the client side JS does the preparation work (e.g. initialize the UI)
                // The payload contains two pieces of information: `lounge_id` and `nth_participant`, which indicates the rank of the current participant among all participants for this game.
                babe.gameChannel.on("start_game", (payload) => {
                    // Set a global state noting that the experiment hasn't finished yet.
                    babe.gameFinished = false;

                    // Add a callback to handle situations where one of the participants leaves in the middle of the experiment.
                    babe.gameChannel.on("presence_diff", (payload) => {
                        if (babe.gameFinished == false) {
                            window.alert(
                                "Sorry. Somebody just left this interactive experiment halfway through and thus it can't be finished! Please contact us to still be reimbursed for your time."
                            );
                        babe.participantChannel.leave();
                        babe.gameChannel.leave();
                            // TODO: Figure out what exactly to do when this happens.
                            // We might not want to submit the results. If we submit, we'd also need to make sure that the participant who dropped out's ExperimentStatus is also marked as "completed" correctly.
                            // babe.submission = colorReferenceUtils.babeSubmitWithSocket(
                            //     babe
                            // );
                            // babe.submission.submit(babe);
                        }
                    });

                    babe.findNextView();
                });

                // Display the message received from the server upon `new_msg` event.
                babe.gameChannel.on("new_msg", (payload) => {
                    let chatBox = document.querySelector("#chat-box");
                    let msgBlock = document.createElement("p");
                    msgBlock.classList.add("babe-view-text");
                    msgBlock.insertAdjacentHTML(
                        "beforeend",
                        `${payload.message}`
                    );
                    chatBox.appendChild(msgBlock);
                    babe.conversation.push(payload.message);

                });

                // Wait until both participants are ready (have read the dialogue)
                let player_ready_count = 0;
                babe.gameChannel.on("initialize_game", (payload) => {
                    player_ready_count = player_ready_count + 1;
                    // We run findNextView() to advance to the next round.
                    if(player_ready_count == this.number_players){
                        babe.findNextView();
                    }
                });

                // Only save the data and do nothing else
                babe.gameChannel.on("end_game", (payload) => {
                    babe.gameFinished = true;
                    saveTrialData(payload.prev_round_trial_data);

                    babe.findNextView();
                });
            },
            CT: 0,
            trials: config.trials
        };

        return _lobby_interactive;
    },
    dialogueView: function(config) {
        const _dialogue = {
            name: config.name,
            title: babeUtils.view.setter.title(config.title, "Instructions"),
            instructions: config.instructions,
            text: config.text,
            button: babeUtils.view.setter.buttonText(config.buttonText),
            render: function(CT, babe) {
                const viewTemplate = `<div class="babe-view">
                    <h1 class='babe-view-title'>${this.title}</h1>
                    <section class="babe-text-container">
                        <p class='babe-view-text'>${this.instructions} <br> You are speaker: ${babe.variant}</p>
                        <br>
                        <pre class="babe-view-text">${(babe.realization == 1) ? this.text : babe.lastIterationResults[0]["conversation"]}</pre>
                    </section>
                    <button id="next" class='babe-view-button'>${
                        this.button
                    }</button>
                </div>`;

                $("#main").html(viewTemplate);

                // Send the "initialize_game"-game message to tell that this participant is ready
                // Also disables the "next"-button and tells the user why
                $("#next").on("click", function(e) {
                      $("#next").text("Waiting for the other participant");
                      $("#next").attr("disabled", "disabled");
                      babe.gameChannel.push("initialize_game", {
                      });
                });
            },
            CT: 0,
            trials: config.trials
        };

        return _dialogue;
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
                                <p class="babe-view-text"><strong> Speaker: ${
                                    babe.variant
                                } </strong>
                                </p>
                                <p id="text-description" class="babe-view-text">
                                    The following is your dialogue:
                                </p>
                                <br>
                                <p id="text-current-iteration" class="babe-view-text">
                                </p>
                            <div id="chat-box"></div>

                            <p class="babe-view-text">
                                Write something before you click "send" or press "enter". It will be shown to the other participant.
                                If you think you have recreated the complete dialogue, click "end dialogue".
                            </p>
                            <div class="babe-view-answer-container">
                                <textarea name="textbox-input" id="text-this-iteration" class='babe-response-text' cols="50" rows="3"></textarea>
                                <button id='end' class='babe-response-buttons'>end dialogue</button>
                                <button id='next' class='babe-response-buttons'>send</button>
                              </div>
                        </div>
                `;

                $("#main").html(viewTemplate);
                // Save the conversation here
                babe.conversation = [];

                // Try to send the typed message, when the user clicks on next or presses enter
                let next = $("#next");
                let textInput = $("textarea");
                next.on("click", function() {
                    send_new_message();
                });
                textInput.on("keydown", function(e) {
                    if(e.keyCode == 13) {
                        send_new_message();
                    };
                });
                // Only send none empty messages and clear the textarea afterwards
                let send_new_message = function() {
                    if(textInput.val().length > 0){
                        babe.gameChannel.push("new_msg", {
                               message: `${babe.variant}: ${textInput.val().trim()}`
                        });
                        textInput.val('');
                    };
                };
                // End the dialogue, if a user presses on the end button
                let end = $("#end");
                end.on("click", function() {
                  // Note that we can only record the reaction time of the guy who actively ended this round. Other interactive experiments might have different requirements though.
                  const RT = Date.now() - startingTime;
                  const trial_data = {
                      trial_number: CT + 1,
                      // Better put them into one single string.
                      conversation: babe.conversation.join("\n"),
                      clicked_on_end: babe.variant,
                      RT: RT
                      };
                      babe.gameChannel.push("end_game", {
                          prev_round_trial_data: trial_data
                      });
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
