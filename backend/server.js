const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Initialize Express app
const app = express();
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:3000", // Allow requests only from the frontend
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Connect to MongoDB Atlas
// mongoose
//   .connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("MongoDB Connected"))
//   .catch((error) => console.log(error));

mongoose
  .connect("mongodb://127.0.0.1:27017/movie")
  .then((e) => console.log("connected"));

// Movie schema
const movieSchema = new mongoose.Schema({
  name: { type: String, required: true },
  releaseDate: { type: Date, required: true },
  averageRating: { type: Number, default: null },
});

// Review schema
const reviewSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  reviewerName: { type: String },
  rating: { type: Number, required: true },
  comments: { type: String },
});

const Movie = mongoose.model("Movie", movieSchema);
const Review = mongoose.model("Review", reviewSchema);

// CRUD endpoints for Movies
app.get("/movies", async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

app.post("/movies", async (req, res) => {
  const movie = new Movie(req.body);
  await movie.save();
  res.json(movie);
});

app.put("/movies/:id", async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(movie);
});

app.delete("/movies/:id", async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ movieId: req.params.id });
  res.json({ message: "Movie and reviews deleted" });
});

// CRUD endpoints for Reviews
app.post("/reviews", async (req, res) => {
  const review = new Review(req.body);
  await review.save();

  const reviews = await Review.find({ movieId: review.movieId });
  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await Movie.findByIdAndUpdate(review.movieId, { averageRating });
  res.json(review);
});

app.put("/reviews/:id", async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(review);
});

app.delete("/reviews/:id", async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  const reviews = await Review.find({ movieId: review.movieId });
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  await Movie.findByIdAndUpdate(review.movieId, { averageRating });
  res.json({ message: "Review deleted" });
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
