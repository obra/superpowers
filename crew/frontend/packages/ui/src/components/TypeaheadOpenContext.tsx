import { createContext, useContext, useState, ReactNode } from 'react';

export type TypeaheadOpenContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export const TypeaheadOpenContext = createContext<
  TypeaheadOpenContextType | undefined
>(undefined);

export function TypeaheadOpenProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TypeaheadOpenContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </TypeaheadOpenContext.Provider>
  );
}

export function useTypeaheadOpen() {
  const context = useContext(TypeaheadOpenContext);
  if (context === undefined) {
    throw new Error(
      'useTypeaheadOpen must be used within a TypeaheadOpenProvider'
    );
  }
  return context;
}
