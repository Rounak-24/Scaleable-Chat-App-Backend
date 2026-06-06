import { getProducer, kafka } from "../config/kafka.js"
import type { IMsgPayload } from "./socket";
import { saveMessage } from "../services/message.services.js"

export const produceMessage = async (payload:IMsgPayload)=>{
    try{
        const producer = await getProducer()
        console.log(`got produccer: ${producer}`)
        await producer.send({
            messages:[{
                key:`conv: ${payload.conversationId}`,
                value:JSON.stringify(payload)
            }],
            topic:"MESSAGES"
        })

        console.log(`message produced to kafka, conv: ${payload.conversationId}, Time: ${new Date(Date.now())}`)
        return true

    } catch(err){
        console.log(`Error occured for produceMessage ${err}`)
    }
}


export const startMessageConsumer = async ()=>{
    const consumer = kafka.consumer({
        groupId:"default"
    })

    await consumer.connect()
    await consumer.subscribe({
        topic:"MESSAGES",
        fromBeginning: true
    })

    await consumer.run({
        autoCommit: true,
        eachMessage: async ({message, pause})=>{
            console.log(`New message received....`)
            if(!message.value) return

            try{
                const msgValue = message.value.toString()
                const payloadObj = JSON.parse(msgValue)
                // console.log(payloadObj)

                const isSaved = await saveMessage(payloadObj)
                if(!isSaved) throw Error("Something went wrong while saving msg in DB")

            }catch(err){
                console.log(`Error occured for Kafka message consumer`)
                pause()
                setTimeout(()=>{
                    consumer.resume([{
                        topic: "MESSAGES"
                    }])
                }, 60*1000)
            }
        }
    })
}