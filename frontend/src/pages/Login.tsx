import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleSuccess = (credentialResponse: any) => {
    console.log('Encoded JWT ID token:', credentialResponse.credential);
    // Mocking the backend /api/auth/me redirect logic here for now
    navigate('/dashboard');
  };

  const handleError = () => {
    console.error('Google Login Failed');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>MealMate Login</h1>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
      />
    </div>
  );
}