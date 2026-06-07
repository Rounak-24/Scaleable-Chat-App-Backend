# 💬 Distributed Real-Time Chat Application

A highly scalable, real-time chat architecture built with Node.js, Socket.IO, Redis, and Apache Kafka. This project demonstrates how to build a production-ready messaging system that can scale horizontally across multiple backend servers while ensuring reliable database persistence.

## 🏗 Architecture Flow

Unlike a basic Socket.IO app where users must be connected to the same server instance to chat, this application uses a robust distributed architecture:

1. **Client Connection:** Users authenticate via JWT and connect to a backend node via Socket.IO.
2. **Message Dispatch:** A message is sent to the backend and instantly published to a **Redis Pub/Sub** channel.
3. **Cross-Server Routing:** A static Redis subscriber catches the message and uses Socket.IO to emit it specifically to the recipient's secure `conversationId` room, regardless of which server they are connected to.
4. **Reliable Persistence:** Simultaneously, the message payload is pushed to an **Apache Kafka** topic.
5. **Decoupled Database Writing:** A dedicated Kafka consumer reads the topic and saves the message to the database, ensuring the real-time socket performance is never blocked by database latency.

## ✨ Key Features

* **Secure Authentication:** JWT-based auth protecting both REST endpoints and Socket.IO handshakes.
* **1-on-1 Direct Messaging:** Users can search via email, initialize a conversation, and chat in real-time.
* **Multi-Device Sync:** Messages are emitted to the room, instantly updating the sender's UI if they are logged in on both a laptop and a phone.
* **Distributed Ready:** Redis Pub/Sub integration prevents memory leaks and allows for horizontal scaling.
* **Fault-Tolerant Consumers:** Custom Kafka consumer logic to gracefully skip "Poison Pill" (corrupted) messages without pausing the queue.

## 🛠 Tech Stack

* **Backend:** Node.js, Express.js, TypeScript
* **Real-Time:** Socket.IO
* **Message Broker:** Apache Kafka (KafkaJS)
* **In-Memory Store / PubSub:** Redis (ioredis)
* **Frontend:** Vanilla HTML/CSS/JS (to cleanly test the backend architecture)

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed running on your machine:
* Node.js (v18+)
* Redis Server (running on default port 6379)
* Apache Kafka & Zookeeper (running on default port 9092)

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/distributed-chat-app.git](https://github.com/yourusername/distributed-chat-app.git)
   cd <main_folder_name>

1. Install dependencies:
   ```bash
   npm install

2. Setup And Migrate Prisma:
   ```bash
    npx prisma generate
    npx prisma migrate deploy

3. run docker container for Redis and Kafka:
   ```bash 
   docker compose up -d

4. Run with tsx:
   ```bash
   npm run dev
   
