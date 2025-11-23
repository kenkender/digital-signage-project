const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "default",
  },
  items: [
    {
      type: {
        type: String,   // image, video, youtube
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,   // seconds
        default: 5,
      }
    }
  ]
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
