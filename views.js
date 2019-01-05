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
        'This is an example of an iterated-interactive experiment with _babe. More information can be found <a href="https://babe-project.github.io/babe_site/">here</a>.',
    buttonText: "Begin Experiment"
});

const instructions = babeViews.instructions({
    trials: 1,
    name: "instructions",
    title: "General Instructions",
    text: `
    This is a demo of an iterated-interactive experiment. There are 2 variants (speaker A and speaker B), 3 chains in total, with 10 realizations per chain. The participants assigned the tuple &lt;X, chain-nr, realization-nr&gt; must wait for information to come from the participants &lt;X, chain-nr, realization-nr - 1&gt;.

    <br>
    <br>

    The participant will first go into a lobby. If an opening is available and there is another participant, they will start the task immediately. Otherwise, they will wait until previous participants have finished the task, by which point they will be notified and start the task.
    `,
    buttonText: "To the Lobby"
});

const lobby_iterated = iteratedExperimentViews.iteratedExperimentLobby({
    name: "lobby",
    trials: 1,
    title: "Lobby_iterated",
    text: "Connecting to the server..."
});

const lobby_interactive = iteratedExperimentViews.interactiveExperimentLobby({
    name: "lobby",
    trials: 1,
    title: "Lobby_interactive",
    number_players: 2,
    text: "Waiting for other participants"
});

const dialogue = iteratedExperimentViews.dialogueView({
    name: "dialogue",
    trials: 1,
    title: "Dialogue",
    instructions: `
    Try to remember the following dialogue as good as possible.
    Afterwards you will have to recreate the dialogue together with another participant.
    `,
    text:`
    1: Hallo
    2: How are you?
    1: Fine
    2: Bye
    `,
    buttonText: "Start the experiment"
})

const trial = iteratedExperimentViews.trialView({
    name: "trial",
    trials: 1,
    title: "Demo trial"
});

const pos_test_view = babeViews.postTest({
    trials: 1,
    name: 'post_test',
    title: 'Weitere Angaben',
    text: 'Die Beantwortung der folgenden Fragen ist optional, aber es kann bei der Auswirkung hilfreich sein, damit wir Ihre Antowrten besser verstehen.',
    buttonText: 'Weiter',
    age_question: 'Alter',
    gender_question: 'Geschlecht',
    gender_male: 'männlich',
    gender_female: 'weiblich',
    edu_question: 'Höchster Bildungsabschluss',
    edu_graduated_high_school: 'Abitur',
    edu_graduated_college: 'Hochschulabschluss',
    edu_higher_degree: 'Universitärer Abschluss',
    languages_question: 'Muttersprache',
    languages_more: '(in der Regel die Sprache, die Sie als Kind zu Hause gesprochen haben)',
    comments_question: 'Weitere Kommentare'
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
