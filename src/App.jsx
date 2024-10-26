import "./App.css";
import React, { useState, useEffect } from "react";
import { getFhevmInstance } from "./utils/fhevm";
import { Connect } from "./Connect";
import ConfidentialERC20 from "./ConfidentialERC20";

function App() {
  const [instance, setInstance] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const fhevmInstance = await getFhevmInstance();
      setInstance(fhevmInstance);
    };

    initialize();
  }, []);

  if (!instance) <></>

  return (
    <div className="App flex flex-col justify-center font-press-start text-black">
      <div>
        <Connect>
          {() => (
            <ConfidentialERC20 />
          )}
        </Connect>
      </div>
    </div>
  );
}

export default App;
