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
        this.subjectsData = []
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
        this.totalOfSubjects = 0
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
    async readTeachers(filename) {

        const parser = fs.createReadStream(`./dataset/${filename}`)
            .pipe(parse({ delimiter: ";", fromLine: 2 }))

        for await (const record of parser) {
            console.log("RECORD: ", record)
            this.teachers.push(record[0])
            this.subjectsOffered.push(record[1])
            this.subjects.push(record.slice(2, 6))
        }

    }

    /**
     * Read the subjects file and return formatted data
     *
     * @param filename name of the file in /dataset
     */
    async readSubjects(filename) {
        let count = 0

        const parser = fs.createReadStream(`./dataset/${filename}`)
            .pipe(parse({ delimiter: ";", fromLine: 2 }))

        for await (const record of parser) {
            console.log("RECORD SUBJECT: ", record)
            this.subjectsData.push(record)
            count++
        }

        this.totalOfSubjects = count - 1


    }

    /**
     * Clean all unused data in data structures
     */
    cleanData() {

        const filteredTeachers = this.teachers.filter(value => {
            return value !== ""
        })

        const filteredSubjects = this.subjects.map(subject => subject.filter(value => value !== ""))

        for (let subject of filteredSubjects) {
            if (subject.length === 0) {
                filteredSubjects.splice(filteredSubjects.indexOf(subject), 1)
            }
        }

        const totalClasses = this.subjectsData.pop().find(el => el != "")
        const convertedTotalClasses = parseInt(totalClasses)

        this.teachers = filteredTeachers
        this.subjects = filteredSubjects
        this.numOfClasses = convertedTotalClasses

    }

    /**
     * Set the key/value of each teacher and subject
     */
    setTeachersAndSubjectsIndexes() {
        for (let i = 0; i < this.teachers.length; i++) {
            this.teachersIndex[i + 1] = [this.teachers[i], this.subjectsOffered[i], this.subjects[i]]
        }

        const subjectsCopies = this.subjects.slice()

        for (let j = this.teachers.length + 1; j < this.numVet - 1; j++) {
            for (const subject of subjectsCopies) {
                this.subjectsIndex[j] = subject
                subjectsCopies.splice(subjectsCopies.indexOf(subject), 1)
                break
            }
        }
    }

    /**
     * Set edges from source vertex to teachers
     */
    setSourceEdges() {
        let copy = [0]
        copy = copy.concat(this.subjectsOffered)

        for (let i = 0; i < this.teachers.length + 1; i++) {
            let sinkTeacher = i
            let teacherCapacity = copy[i]
            this.addEdge(this.matAdj[0][i], sinkTeacher, teacherCapacity)
        }

        this.matAdj[0][0] = 0
        this.listAdj[0].pop(0)
    }

    /**
     * Set edges from subjects to sink vertex
     */
    setSinkEdges() {
        const sink = this.numVet - 1
        let subjectsCapacities = []
        let subjectCapacity = null

        for (const subject of this.subjectsData) {
            subjectsCapacities.push(subject[2])
        }

        for (let i = this.teachers.length + 1; i < this.numVet - 1; i++) {
            let sourceSubject = i
            for (const capacity of subjectsCapacities) {
                subjectCapacity = capacity
                subjectsCapacities.splice(subjectsCapacities.indexOf(capacity), 1)
                break
            }
            this.addEdge(sourceSubject, sink, subjectCapacity)
        }
    }


    setTeachersToSubjectsEdges() {

    }

    async run() {
        await this.readTeachers("professores_toy.csv")
        await this.readSubjects("disciplinas_toy.csv")
        this.cleanData()

        this.numVet = 2 + this.teachers.length + this.totalOfSubjects
        this.matAdj = Array(this.numVet).fill(0).map(() => Array(this.numVet).fill(0))
        this.listAdj = Array(this.numVet).fill([])

        this.setTeachersAndSubjectsIndexes()
        this.setSourceEdges()
        this.setSinkEdges()
    }
}

