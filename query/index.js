const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

const handleEvent = (type, data) => {
  if (type === "PostCreated") {
    const { id, title } = data;

    posts[id] = { id, title, comments: [] };
  }

  if (type === "CommentCreated") {
    const { id, content, postId, status } = data;

    const post = posts[postId];
    post.comments.push({ id, content, status });
  }

  if (type === "CommentUpdated") {
    const { id, content, postId, status } = data;

    const post = posts[postId];

    const comment = post.comments.find((comment) => {
      return comment.id === id;
    });

    comment.status = status;
    comment.content = content;
  }
};

app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/events", (req, res) => {
  const { type, data } = req.body;

  handleEvent(type, data);

  res.send({});
});

app.listen(4002, async () => {
  console.log("Listening on 4002");

  const res = await axios.get("http://localhost:4005/events");
  // This will send a request to the event bus database and get all the events that have been emitted.
  // So even though this service crashes for sometime, it still can reach out to the event bus database and
  // get all the events that occurred during that time.

  for (let event of res.data) {
    console.log("Processing event:", event.type);

    handleEvent(event.type, event.data);
    // This will now sync all the events that have been emitted to the event bus database even during the
    // the period that the service is down. It will instantly run all other event processes like
    // PostCreated, CommentCreated, CommendModerated and CommentUpdated that was not be able to run because of the service crash.
  }
});
