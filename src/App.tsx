import { useRef, useEffect } from "react";
import { MazeCanvasProvider, MazeSceneFactory } from "./MazeSceneFactory";
import { DependencyContainerContext, Container, useInstance } from '@symbiotic/green-state';
import { MazeRunnerIOC } from "./MazeRunnerIOC";

class AppContainer extends DependencyContainerContext {
  containerMounted = (container: Container) => {
    (container.get(MazeRunnerIOC) as MazeRunnerIOC).injectDependencies();
  }
}

// TODO: quotes
// TODO: 4 spaces
// TODO: get inspector in our game
// TODO: follow camera

const MazeRunner = () => {
  const canvasRef = useRef(null);
  const canvasProvider = useInstance(MazeCanvasProvider) as MazeCanvasProvider;
  const mazeFactory = useInstance(MazeSceneFactory) as MazeSceneFactory;

  useEffect(() => {
    if (canvasRef.current){
      canvasProvider.setCanvas(canvasRef.current)
      mazeFactory.startScene();
    }

  }, [canvasRef, mazeFactory, canvasProvider]);

  return (<canvas id="renderCanvas" ref={canvasRef} style={{ width: '100%', height: '100%'}} />);
}

function App() {
  return (
    <AppContainer>
      <MazeRunner />
    </AppContainer>
  );
}

export default App;
