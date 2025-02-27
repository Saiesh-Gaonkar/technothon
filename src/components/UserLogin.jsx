import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import './UserLogin.css';

const UserLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'prefer-not-to-say',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.name.trim() || !formData.age) {
        throw new Error('Please fill in all required fields');
      }

      const docRef = await addDoc(collection(db, 'users'), {
        ...formData,
        timestamp: new Date(),
        isOnline: true,
        hasLocation: false
      });

      const userData = {
        ...formData,
        userId: docRef.id,
        hasLocation: false
      };

      onLogin(userData);
      toast.success('Welcome ' + formData.name + '!');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Quick Registration</h2>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          placeholder="Your Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Age"
          required
          min="13"
          max="120"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
        />
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        >
          <option value="prefer-not-to-say">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Start Using App'}
        </button>
      </form>
    </div>
  );
};

export default UserLogin; 