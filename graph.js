import fs from 'fs'
import {parse} from "csv";

export class Graph {

    constructor(numVet = 0, numEdg = 0, matAdj = null, listAdj = null) {
        this.numVet = numVet
        this.numEdg = numEdg

        if (matAdj === null) {
            this.matAdj = Array(numVet).fill(0).map(() => Array(numVet).fill(0))
        } else {
            this.matAdj = matAdj
        }

        if (listAdj === null) {
            this.listAdj = Array(numVet).fill([])
        } else {
            this.listAdj = listAdj
        }

        this.subjectsIndex = {}
        this.teachersIndex = {}
        this.numOfClasses = 0
        this.edgesList = []
        this.awayTeachers = []
        this.subjects = []
        this.teachers = []
        this.subjectsOffered = []
    }

    /**
     * Function to reset the object for CLI use
     *
     * @param numVet number of vertex
     * @param numEdg number of edges
     * @param matAdj adjacency matrix
     * @param listAdj adjacency list
     */
    reset(numVet = 0, numEdg = 0, matAdj = null, listAdj = null) {
        this.numVet = numVet
        this.numEdg = numEdg

        if (matAdj === null) {
            this.matAdj = Array(numVet).fill(0).map(() => Array(numVet).fill(0))
        } else {
            this.matAdj = matAdj
        }

        if (listAdj === null) {
            this.listAdj = Array(numVet).fill([])
        } else {
            this.listAdj = listAdj
        }

        this.subjectsIndex = {}
        this.teachersIndex = {}
        this.numOfClasses = 0
        this.edgesList = []
        this.awayTeachers = []
        this.subjectsData = []
        this.totalOfSubjects = []
    }

    /**
     * Add an edge on the graph from source to sink in format [flow, capacity]
     *
     * @param source source vertex
     * @param sink sink vertex
     * @param capacity capacity of the edge
     * @param flow flow of the edge
     */
    addEdge(source, sink, capacity = Infinity, flow = 0) {
        if (source < this.numVet && sink < this.numVet) {
            this.matAdj[source][sink] = [flow, capacity]
            this.listAdj[source].push([sink, [flow, capacity]])
            this.numEdg++
        } else {
            console.error("Invalid edge")
        }
    }

    /**
     * Remove an edge on the graph
     *
     * @param source source vertex
     * @param sink sink vertex
     */
    removeEdge(source, sink) {
        if (source < this.numVet && sink < this.numVet) {
            if (this.matAdj[source][sink] !== 0) {
                this.matAdj[source][sink] = 0;

                this.listAdj[source].forEach((v, _) => {
                    return v != sink
                })
            }

            this.numEdg--
        } else {
            console.error("Invalid edge")
        }
    }

    /**
     * Set list of edges in format: source, sink, [flow, capacity]
     */
    setEdgesList() {
        for (let i = 0; i < this.matAdj.length; i++) {
            for (let j = 0; j < this.matAdj[i].length; j++) {
                if (this.matAdj[i][j] != 0) {
                    let [flow, capacity] = this.matAdj[i][j]
                    this.edgesList.push([i, j, flow])
                }
            }
        }
    }

    /**
     * Read teachers file and return formatted data
     *
     * @param filename name of the file in /dataset
     */
    readTeachers(filename) {

        fs.createReadStream(`./dataset/${filename}`)
            .pipe(parse({ delimiter: ";", fromLine: 2}))
            .on( 'data',   (row) => {
                this.teachers.push(row[0])
                this.subjectsOffered.push(row[1])
                this.subjects.push(row.slice(2, 6))
            })
            .on('end', () => {
                this.subjects.filter((subject) => {
                    return subject !== ""
                })

                this.subjectsOffered.pop()
            })
    }

    /**
     * Read the subjects file and return formatted data
     *
     * @param filename name of the file in /dataset
     */
    readSubjects(filename) {


        // fs.createReadStream(`./dataset/${filename}`)
        //     .pipe(parse({ delimiter: ";", fromLine: 2 }))
        //     .on('data', (row) => {
        //         this.subjectsData.push([row])
        //         this.totalOfSubjects++
        //     })
        //     .on('end', () => {
        //         this.numOfClasses = this.subjectsData.pop()
        //
        //         this.numOfClasses.filter((data) => {
        //             return data !== ""
        //         })
        //     })
    }

    run() {
        this.readTeachers("professores_toy.csv")
        this.readSubjects("disciplinas_toy.csv")
    }
}

