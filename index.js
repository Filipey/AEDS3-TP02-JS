import {Graph} from "./graph.js";

const graph = new Graph()

graph.menu()
    .then(r => console.log("Ended."))