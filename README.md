Demo of iterated-interactive experiments with \_babe.

Online demo available [here](https://iterated-interactive-example.netlify.com/). You have too open the link twice, because it is an experiment for two persons.

The example corresponds to the experiment with ID 60 on https://babe-demo.herokuapp.com

First, clone the repo and run `npm install` in the folder.

Under the new server structure for complex experiments, each participant is assigned a trituple `<variant-nr, chain-nr, realization-nr>`. Those numbers increase in the order of:

1. `variant-nr`
2. `chain-nr`
3. `realization-nr`

In this experiment, there are two variants, two chains, and 10 realizations for each chain.

Each time you open `index.html` in your browser, you will join the experiment as a new participant.

The participants `<X, chain-nr, realization-nr + 1>` waits on the results of the participants `<X, chain-nr, realization-nr>`.

The first two participants will perform the first realization of the first chain, the third and forth participant will perform the first realization of the second chain. The fifth and sixth participant will perform the second realization of the first chain, but only after the first two participants have finished.

The trituple for each participant is written to the console.
