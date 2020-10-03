const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [auth, [check('text', 'Text is required...').notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      // Once we add the post we will get it back in the response
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error creating a new post...');
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // date-1 to return most recent posts
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error getting all posts...');
  }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found...' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);

    // To check if the post id is invalid
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found...' });
    }

    res.status(500).send('Server error getting all posts...');
  }
});

// @route   DELETE api/posts
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // To check if the post id is invalid
    if (!post) {
      return res.status(404).json({ msg: 'Post not found...' });
    }

    // Check user post x user logged
    if (post.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: 'User not authorized to delete this post...' });
    }

    await post.remove();

    res.json({ msg: 'Post removed!' });
  } catch (err) {
    console.error(err.message);

    // To check if the post id is invalid
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found...' });
    }

    res.status(500).send('Server error getting all posts...');
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if post has already been liked by this user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server error liking the post...');
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if post has already been liked by this user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    // Get the remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server error liking the post...');
  }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
  '/comment/:id',
  [auth, [check('text', 'Text is required...').notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      // Once we add the post comment we will get it back in the response
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error adding comment...');
    }
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete a comment on a post
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    // Get post ID
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist...' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: 'User not authorized to delete this comment...' });
    }

    console.log(req.params);

    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await post.save();

    // Once we add the post comment we will get it back in the response
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error deleting comment...');
  }
});

module.exports = router;
