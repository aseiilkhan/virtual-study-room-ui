import React, { createContext, useContext, useState } from 'react';
import { useStore } from 'zustand';

const StoreContext = createContext('')
export function BackgroundSelector() {

  const store = useContext(StoreContext)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('backgroundImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
        <h5>Background selector</h5>
      <input type="file" onChange={handleFileChange} />
      {selectedFile && (
        <p>Selected file: {selectedFile.name}</p>
      )}
    </div>
  );
}
export default BackgroundSelector;
