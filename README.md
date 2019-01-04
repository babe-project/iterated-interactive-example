Demo of iterated-interactive experiments with \_babe.

The example corresponds to the experiment with ID 51 on https://babe-demo.herokuapp.com

First, clone the repo and run `npm install` in the folder.

Under the new server structure for complex experiments, each participant is assigned a trituple `<variant-nr, chain-nr, realization-nr>`. Those numbers increase in the order of:

1. `variant-nr`
2. `chain-nr`
3. `realization-nr`

In this experiment, there are two variants, three chains, and 10 realizations for each chain.

Each time you open `index.html` in your browser, you will join the experiment as a new participant.

The participants `<X, chain-nr, realization-nr + 1>` waits on the results of the participants `<X, chain-nr, realization-nr>`.

Therefore, assuming nobody submitted any results yet, the seventh tab you open should have you wait in the lobby, until you submit the result in the first tab, by which time the results will be shown to the fourth participant.

For demonstration sake, the trituple for each participant is explicitly displayed at the trial view.
