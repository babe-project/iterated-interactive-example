/** Wrapping views below

* Obligatory properties

    * trials: int - the number of trials this view will appear
    * name: string

* More about the properties and functions of the wrapping views - https://github.com/babe-project/babe-project/blob/master/docs/views.md#wrapping-views-properties

*/

const init = iteratedExperimentViews.init({
    trials: 1,
    name: "init",
    title: "Initializing"
});

const intro = babeViews.intro({
    name: "intro",
    trials: 1,
    title: "Welcome!",
    text:
        'This is an example of an interactive experiment with _babe. More information can be found <a href="https://babe-project.github.io/babe_site/">here</a>.',
    buttonText: "Begin Experiment"
});

const instructions = babeViews.instructions({
    trials: 1,
    name: "instructions",
    title: "General Instructions",
    text: `
    This is a demo of an iterated experiment. There are 3 chains in total, with 20 realizations per chain. (There's only one "variant".) The participant assigned the tuple &lt;variant-nr, chain-nr, realization-nr&gt; must wait for information to come from the participant &lt;variant-nr, chain-nr, realization-nr - 1&gt;.

    <br>
    <br>

    The participant will first go into a lobby. If an opening is available, they will start the task immediately. Otherwise, they will wait until a previous participant has finished the task, by which point they will be notified and start the task.
    `,
    buttonText: "To the Lobby"
});

const lobby = iteratedExperimentViews.iteratedExperimentLobby({
    name: "lobby",
    trials: 1,
    title: "Lobby",
    text: "Connecting to the server..."
});

const trial = iteratedExperimentViews.trialView({
    name: "trial",
    trials: 1,
    title: "Demo trial"
});

// submits the results
const thanks = iteratedExperimentViews.thanksWithSocket({
    trials: 1,
    name: "thanks",
    title: "Thank you for taking part in this experiment!",
    prolificConfirmText: "Press the button"
});

/** trial (babe's Trial Type Views) below

* Obligatory properties

    - trials: int - the number of trials this view will appear
    - name: string
    - trial_type: string - the name of the trial type as you want it to appear in the submitted data
    - data: array - an array of trial objects


* Optional properties

    - pause: number (in ms) - blank screen before the fixation point or stimulus show
    - fix_duration: number (in ms) - blank screen with fixation point in the middle
    - stim_duration: number (in ms) - for how long to have the stimulus on the screen
        More about trial lifecycle - https://github.com/babe-project/babe-project/blob/master/docs/views.md#trial-views-lifecycle

    - hook: object - option to hook and add custom functions to the view
        More about hooks - https://github.com/babe-project/babe-project/blob/master/docs/views.md#trial-views-hooks

* All about the properties of trial - https://github.com/babe-project/babe-project/blob/master/docs/views.md#properties-of-trial

*/
