import { Container } from "@symbiotic/green-state";

export class MazeRunnerIOC{
    static inject = () => [Container];
    constructor(private container: Container){}
    injectDependencies =  () => {

    }
}