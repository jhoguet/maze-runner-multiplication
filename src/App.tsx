import { useRef, useEffect } from "react";
import { MazeSceneFactory } from "./MazeSceneFactory";

// TODO: quotes
// TODO: 4 spaces
// TODO: get inspector in our game
// TODO: follow camera

const MazeRunner = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    new MazeSceneFactory().startScene({ canvasRef: canvasRef.current as unknown as HTMLCanvasElement})
  }, [canvasRef]);

  return (<canvas id="renderCanvas" ref={canvasRef} style={{ width: '100%', height: '100%'}} />);
}

function App() {
  return (
    <MazeRunner />
  );
}

export default App;
