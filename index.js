import { Graph } from "./graph.js";

const graph = new Graph()

graph.menu()
    .then(() => console.log("\nProcess ended"))