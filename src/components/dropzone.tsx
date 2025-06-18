import { useDrop } from "react-dnd";

type DropzoneProps = {
  onDrop: (item: any) => void;
  children: React.ReactNode;
};

export function Dropzone({ onDrop, children }: DropzoneProps) {
  const [{ isOver }, drop] = useDrop({
    accept: "NOTE",
    drop: onDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop as any}
      className={`border-2 border-muted border-dashed rounded-lg transition-colors ${
        isOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
    >
      {children}
    </div>
  );
}
