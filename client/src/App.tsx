import React from 'react';
import { GameBoard } from './components/GameBoard';
import { Toaster } from './components/ui/sonner';
import "@fontsource/inter";

function App() {
  return (
    <div className="w-full h-full">
      <GameBoard />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
