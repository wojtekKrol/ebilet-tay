import chalk from "chalk";
import figures from "figures";

const log = console.log;

const info = (message) => {
    log(chalk.blue(`${figures.info} ${message}`));
};

const success = (message) => {
    log(chalk.green(`${figures.tick} ${message}`));
};

const warn = (message) => {
    log(chalk.yellow(`${figures.warning} ${message}`));
};

const error = (message) => {
    log(chalk.red(`${figures.cross} ${message}`));
};

export default {
    info,
    success,
    warn,
    error,
};
