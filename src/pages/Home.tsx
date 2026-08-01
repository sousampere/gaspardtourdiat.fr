import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';

function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to my website!</p>
      <Button variant='contained' color='success' startIcon={<DeleteIcon />}>Hey bro</Button>
    </div>
  );
}

export default Home;
