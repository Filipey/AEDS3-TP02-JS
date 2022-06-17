import fs from 'fs'
import {parse} from "csv";
import { createInterface } from 'readline'

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
    removeEdge(source, sink, flow) {

        for (const edge of this.edgesList) {
            if (edge[0] === source) {
                if (edge[1] === sink) {
                    if (edge[2] === flow) {
                        this.edgesList.splice(this.edgesList.indexOf(edge), 1)
                        break
                    }
                }
            }
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

        const subjectsCopies = this.subjectsData.slice()

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

    /**
     * Set edges from each teacher to their respective subject
     */
    setTeachersToSubjectsEdges() {
        const flow = [0, 3, 5, 8, 10]
        const teachers = this.teachersIndex
        const subjects = this.subjectsIndex

        for (const [teacherKey, teacherData] of Object.entries(teachers)) {
            let totalClassesOffered = 0
            for (const [subjectKey, subjectData] of Object.entries(subjects)) {
                if (totalClassesOffered === teachers[teacherKey][2].length) {
                    break
                }
                if (teachers[teacherKey][1] == 0) {
                    this.awayTeachers.push(teachers[teacherKey][0])
                }
                if (teachers[teacherKey][2].includes(subjectData[0])) {
                    if (subjectData[0] == 'CSI000') {
                        subjectData[2] = 1
                    }
                    this.addEdge(teacherKey, subjectKey, subjectData[2], flow[teachers[teacherKey][2].indexOf(subjectData[0])])
                }
            }
        }

    }

    /**
     * Set the initial data based on csv files
     * @returns {Promise<void>}
     */
    async setInitialData(teachersFile, subjectsFile) {
        await this.readTeachers(teachersFile)
        await this.readSubjects(subjectsFile)
        this.cleanData()

        this.numVet = 2 + this.teachers.length + this.totalOfSubjects
        this.matAdj = Array(this.numVet).fill(0).map(() => Array(this.numVet).fill(0))
        this.listAdj = Array(this.numVet).fill([])

        this.setTeachersAndSubjectsIndexes()
        this.setSourceEdges()
        this.setSinkEdges()
        this.setTeachersToSubjectsEdges()
        this.setEdgesList()
    }

    /**
     * BellmanFord algorithm to get the shortest path from s to v
     * @param s source vertex
     * @param v sink vertex
     * @returns {null|*[]}
     */
    bellmanFord(s, v) {
        let dist = Array(this.listAdj.length).fill(9999)
        let pred = Array(this.listAdj.length).fill(null)
        let edges = this.edgesList.slice()

        dist[s] = 0

        for (let i = 0; i < this.listAdj.length - 1; i++) {
            let trade = false
            for (const [source, sink, flow] of edges) {
                if (dist[sink] > dist[source] + flow) {
                    dist[sink] = dist[source] + flow
                    pred[sink] = source
                    trade = true
                }
            }
            if(trade === false) {
                break
            }
        }

        let shortestPath = [v]
        let i = pred[v]
        while (i in pred) {
            if (i === null) {
                break
            }

            shortestPath.push(i)
            i = pred[i]
        }

        if (shortestPath.length === 1) {
            return null
        }

        shortestPath.reverse()

        return shortestPath
    }

    /**
     * Get the flow that should pass by each vertex
     * @returns {number[]}
     */
    getFlowByVertex() {
        let b = [this.numOfClasses]

        for (const [teacherKey, teacherData] of Object.entries(this.teachersIndex)) {
            b.push(parseInt(teacherData[1]))
        }

        for (const [subjectKey, subjectData] of Object.entries(this.subjectsIndex)) {
            b.push(parseInt(subjectData[2]))
        }

        b.push(-this.numOfClasses)

        return b
    }

    /**
     * Get the flow and capacity of each edge
     * @returns {any[][][]}
     */
    getFlowAndCapacityOfEachEdge() {
        let flowOfEdges = Array(this.numVet).fill(0).map(() => Array(this.numVet).fill(0))
        let capacityOfEdges = Array(this.numVet).fill(0).map(() => Array(this.numVet).fill(0))

        for (let i = 0; i < this.matAdj.length; i++) {
            for (let j = 0; j < this.matAdj[i].length; j++) {
                if (this.matAdj[i][j] != 0) {
                    let [flow, capacity] = this.matAdj[i][j]
                    flowOfEdges[i][j] = parseInt(flow)
                    capacityOfEdges[i][j] = parseInt(capacity)
                }
            }
        }

        return [flowOfEdges, capacityOfEdges]
    }

    /**
     * Succesful shortest paths algorithm
     * @param s source vertex
     * @param t sink vertex
     * @returns {any[][]}
     */
    succesfulShortestPaths(s, t) {
        let F = Array(this.numVet).fill(0).map(() => Array(this.numVet).fill(0))

        let flowByVertex = this.getFlowByVertex()
        let [flowOfEdges, capacityOfEdges] = this.getFlowAndCapacityOfEachEdge()
        let shortestPath = this.bellmanFord(s, t)

        while (shortestPath !== null && flowByVertex[s] !== 0) {
            let maxFlow = 9999
            for (let i = 1; i < shortestPath.length; i++) {
                let u = shortestPath[i - 1]
                let v = shortestPath[i]

                if (capacityOfEdges[u][v] < maxFlow) {
                    maxFlow = capacityOfEdges[u][v]
                }
            }

            for (let i = 1; i < shortestPath.length; i++) {
                let u = shortestPath[i - 1]
                let v = shortestPath[i]
                F[u][v] += maxFlow
                capacityOfEdges[u][v] -= maxFlow

                if (capacityOfEdges[u][v] == 0) {
                    this.matAdj[u][v] = 0
                    let remove = [u, v, flowOfEdges[u][v]]
                    this.removeEdge(u, v, flowOfEdges[u][v])
                }

                if (this.matAdj[v][u] == 0) {
                    this.matAdj[v][u] = 1
                    this.edgesList.push([v, u, -flowOfEdges[u][v]])
                    flowOfEdges[v][u] = -flowOfEdges[u][v]
                }

                capacityOfEdges[v][u] += maxFlow

                if (F[v][u] != 0) {
                    F[v][u] -= maxFlow
                }
            }

            flowByVertex[s] -= maxFlow
            flowByVertex[t] += maxFlow

            shortestPath = this.bellmanFord(s, t)

        }


        return F
    }

    /**
     * Log the final data to user
     * @param finalMatrix succesfulShortesPath result
     */
    formatData(finalMatrix) {
        let edges = []
        const costs = [0, 3, 5, 8, 10]
        let totalCost = 0
        let totalClasses = 0
        const teachersKeys = Object.keys(this.teachersIndex)
        const subjectsKeys = Object.keys(this.subjectsIndex)

        for (let i = 0; i < finalMatrix.length; i++) {
            for (let j = 0; j < finalMatrix[i].length; j++) {
                if (finalMatrix[i][j] !== 0) {
                    if (teachersKeys.includes(String(i)) && subjectsKeys.includes(String(j))) {
                        edges.push([i, j, finalMatrix[i][j]])
                    }
                }
            }
        }


        for (const [teacher, subject, classes] of edges) {
            let subjectId = this.subjectsIndex[subject][0]
            let teacherSubjects = this.teachersIndex[teacher][2]
            let subjectCost = teacherSubjects.indexOf(subjectId)

            console.log(`\nTeacher: ${this.teachersIndex[teacher][0]},
             Subject: ${subjectId},
             Name: ${this.subjectsIndex[subject][1]},
             Classes: ${classes},
             Cost: ${costs[subjectCost] * classes}
             `)
            totalCost += costs[subjectCost] * classes
            totalClasses += classes
        }

        console.log(`The total cost was ${totalCost}`)
        console.log(`Total classes allocated: ${totalClasses}`)

        if (this.awayTeachers.length !== 0) {
            this.awayTeachers = [...new Set(this.awayTeachers)]
            console.log(`This teachers dont offer any subject: ${this.awayTeachers}`)
        } else {
            console.log(`All teachers offer at least one subject`)
        }

    }

    async menu() {
        console.log("\nWelcome to the DECSI JavaScript resource allocation!")

        console.log("\nNow, you gonna se the original allocation: ")

        await this.run("professores.csv", "disciplinas.csv")
    }

    /**
     * Script main function
     * @returns {Promise<void>}
     */
    async run(teachersFile, subjectsFile) {
        await this.setInitialData(teachersFile, subjectsFile)
        this.formatData(this.succesfulShortestPaths(0, this.numVet -1))
    }
}

