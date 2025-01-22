import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useStudyRoomStore } from './StudyRoom';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);  // Switch between Sign In and Sign Up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const {isAuthenticated, setIsAuthenticated, isLoading, setIsLoading} = useStudyRoomStore();
  const handleSignIn = async (e: any) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/login', {
        email,
        password,
      });
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('login_access_token', access_token);
      localStorage.setItem('login_refresh_token', refresh_token);
    } catch (error) {
      setError('Invalid login credentials');
    }
    console.log(localStorage.getItem('login_access_token'));
    console.log(localStorage.getItem('login_refresh_token'));
    checkAuth();
  };

  const handleSignUp = async (e: any) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/api/register', {
        email,
        password,
      });
      if (response.status === 201) {
        setError('');
        setIsSignUp(false);
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('login_access_token'); // Check token from localStorage or cookies
      console.log('trying with token ', token);
      if (token) {
        // Verify token or fetch user details to confirm authentication
        // Replace the following with an actual API call to validate the token
        
        const response = await axios.post(
            'http://localhost:8080/api/protected', 
            {
              email, // Assuming email is needed; remove if unnecessary
              password, // Assuming password is needed; remove if unnecessary
            }, 
            {
              headers: {
                'Authorization': `Bearer ${token}`, // Pass the token in the Authorization header
              },
            }
          );
        if (response.status == 200) {
          setIsAuthenticated(true); // Set to true if the user is authenticated
        }
      }
    } catch (error) {
      console.error("Authentication check failed", error);
    } finally {
      setIsLoading(false); // Stop loading once the check is complete
    }
  };
  useEffect(() => {
    checkAuth(); // Run authentication check on component mount
  }, []);
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="auth-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {isSignUp && (
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}
        <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
};

export default AuthPage;
