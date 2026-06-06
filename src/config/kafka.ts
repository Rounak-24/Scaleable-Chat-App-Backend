import { Kafka, logLevel, type Producer } from "kafkajs"

export const kafka = new Kafka({
    clientId:process.env.KAFKA_CLIENT || "localhost-client",
    brokers:["localhost:9092"],
    logLevel: logLevel.INFO
})

export let producer: Producer | null = null

export const getProducer = async ()=>{
    if(producer) return producer

    const _producer = kafka.producer()
    await _producer.connect()

    producer = _producer
    return producer
}