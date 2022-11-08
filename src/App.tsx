import { useRef, useEffect } from "react";
import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, Mesh } from 'babylonjs';

// TODO: quotes
// TODO: 4 spaces

const MazeRunner = () => {
  const canvasRef = useRef(null);

  useEffect(() => {

    // Load the 3D engine
    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    // CreateScene function that creates and return the scene
    const createScene = function () {
      // Create a basic BJS Scene object
      const scene = new Scene(engine);
      // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
      const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
      // Target the camera to scene origin
      camera.setTarget(Vector3.Zero());
      // Attach the camera to the canvas
      camera.attachControl(canvasRef.current, false);
      // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
      new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
      // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
      var sphere = Mesh.CreateSphere('sphere1', 16, 2, scene, false, Mesh.FRONTSIDE);
      // Move the sphere upward 1/2 of its height
      sphere.position.y = 1;
      // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
      Mesh.CreateGround('ground1', 6, 6, 2, scene, false);
      // Return the created scene
      return scene;
    }
    // call the createScene function
    const scene = createScene();
    // run the render loop
    engine.runRenderLoop(function () {
      scene.render();
    });
    // the canvas/window resize event handler
    window.addEventListener('resize', function () {
      engine.resize();
    });
  }, [canvasRef]);

  return (<canvas id="renderCanvas" ref={canvasRef} style={{ width: '100%', height: '100%'}} />);
}

function App() {
  return (
    <MazeRunner />
  );
}

export default App;
