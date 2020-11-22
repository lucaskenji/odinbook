import React, { useState } from 'react';
import axios from 'axios';

function CommentForm(props) {
  const { postId, triggerRender, loggedUserId } = props;
  const [finishedAsync, setFinishedAsync] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSubmit = (form) => {
    form.preventDefault();
    setFinishedAsync(false);
    setErrorMessage('');
    
    const newComment = {
      author: loggedUserId,
      content: form.target.content.value
    }
    
    const csrfToken = localStorage.getItem('csrfToken');
    
    axios.post(`${process.env.REACT_APP_API_URL}/api/posts/${postId}/comments`, newComment, {
      withCredentials: true,
      headers: { csrf: csrfToken }
    })
      .then((response) => {
        console.log(response);
        triggerRender();
        form.target.reset();
        setFinishedAsync(true);
      })
      .catch((err) => {
        if (!err.response) {
          setErrorMessage('An error occurred. Please try again later.');
        }
        setFinishedAsync(true);
      })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      { errorMessage && <div className="error-message">{errorMessage}</div> }
      <label htmlFor="comment-input" className="sr-only">Write a comment</label>
      <input className="uses-font" disabled={!finishedAsync} type="text" placeholder="Write a comment" id="comment-input" name="content" />
    </form>
  );
}

export default CommentForm;