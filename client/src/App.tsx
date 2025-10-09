import React from 'react';
import { ThemeProvider } from 'next-themes';
import { GameBoard } from './components/GameBoard';
import { Toaster } from './components/ui/sonner';
import "@fontsource/inter";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="w-full h-full">
        <GameBoard />
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;
