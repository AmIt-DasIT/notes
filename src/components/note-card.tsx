import { useState, useEffect, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { format } from "date-fns";
import {
  Trash2,
  Tag,
  Plus,
  X,
  Check,
  ArrowLeft,
  ListTodo,
  Palette,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import type { Note } from "./notebook";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Checkbox } from "./ui/checkbox";
import { useDebounce } from "@/lib/hooks";
import { COLORS } from "./notebook";

type NoteCardProps = {
  note: Note;
  index: number;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  handleClick: (card: Note) => void;
  selected: Note | null;
  lastSelected: Note | null;
  setSelected: (note: Note | null) => void;
};

export function NoteCard({
  note,
  index,
  onUpdate,
  onDelete,
  onMove,
  handleClick,
  selected,
  lastSelected,
  setSelected,
}: NoteCardProps) {
  const [editedNote, setEditedNote] = useState(note);
  const [newTag, setNewTag] = useState("");
  const [newItem, setNewItem] = useState("");
  const debouncedNote = useDebounce(editedNote, 500);
  const prevNoteRef = useRef(note);

  useEffect(() => {
    if (JSON.stringify(note) !== JSON.stringify(prevNoteRef.current)) {
      setEditedNote(note);
      prevNoteRef.current = note;
    }
  }, [note]);

  useEffect(() => {
    if (
      selected?.id === note.id &&
      JSON.stringify(debouncedNote) !== JSON.stringify(note)
    ) {
      onUpdate({
        ...debouncedNote,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [debouncedNote, note.id, selected?.id]);

  const [{ isDragging }, drag] = useDrag({
    type: "NOTE",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "NOTE",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const handleAddTag = () => {
    if (newTag.trim() && !editedNote.tags.includes(newTag.trim())) {
      setEditedNote({
        ...editedNote,
        tags: [...editedNote.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedNote({
      ...editedNote,
      tags: editedNote.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setEditedNote({
        ...editedNote,
        items: [
          ...(editedNote.items || []),
          { id: crypto.randomUUID(), text: newItem.trim(), checked: false },
        ],
      });
      setNewItem("");
    }
  };

  const handleToggleItem = (itemId: string) => {
    setEditedNote({
      ...editedNote,
      items: editedNote.items?.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedNote({
      ...editedNote,
      items: editedNote.items?.filter((item) => item.id !== itemId),
    });
  };

  const cardVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const mobileFullScreenVariants = {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        onClick={() => {
          if (!selected) handleClick(note);
        }}
        ref={(node) => drag(drop(node)) as any}
        className={cn(
          `relative overflow-hidden border shadow-sm bg-card sm:rounded-xl group ${
            isDragging ? "opacity-50" : "opacity-100"
          }`,
          selected?.id === note.id
            ? "fixed inset-0 w-full h-full md:absolute md:h-fit md:w-1/2 md:m-auto z-50 flex flex-col"
            : lastSelected?.id === note.id
            ? "z-40 rounded-xl h-full w-full"
            : "rounded-xl h-full w-full"
        )}
        id={`card-${note.id}`}
        variants={
          selected?.id === note.id ? mobileFullScreenVariants : cardVariants
        }
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover={selected?.id === note.id ? undefined : "hover"}
        transition={{ duration: 0.2 }}
        layout
      >
        {selected?.id === note.id ? (
          <div className="flex flex-col min-h-screen sm:max-h-[calc(100vh-100px)] overflow-auto bg-background">
            <div className="sticky top-0 z-10 flex items-center gap-2 p-4 border-b bg-background">
              <ArrowLeft
                className="h-6 w-6 md:hidden cursor-pointer"
                onClick={() => setSelected(null)}
              />
              <h2 className="text-lg font-semibold">Edit Note</h2>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setSelected(null)}>
                Done
              </Button>
            </div>
            <div className="flex-1 p-4 space-y-6 overflow-auto">
              <div className="space-y-2">
                <Input
                  id="title"
                  type="text"
                  value={editedNote.title}
                  onChange={(e) =>
                    setEditedNote({ ...editedNote, title: e.target.value })
                  }
                  placeholder="Note title"
                  className="font-medium border-none bg-transparent !text-lg placeholder:text-muted-foreground/50"
                />
                <Textarea
                  id="content"
                  value={editedNote.content}
                  onChange={(e) =>
                    setEditedNote({ ...editedNote, content: e.target.value })
                  }
                  className="min-h-[100px] resize-none border-none bg-transparent text-base placeholder:text-muted-foreground/50"
                  placeholder="Note content"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedNote.tags.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="bg-blue-100 text-blue-800 dark:text-blue-400 dark:bg-gray-900 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 group hover:bg-blue-200 transition-colors"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1 border-none bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddTag}
                    className="opacity-50 hover:opacity-100"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Checklist</h3>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {editedNote.items?.length || 0} items
                  </div>
                </div>
                <div className="space-y-2">
                  {editedNote.items?.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 group"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      <Input
                        value={item.text}
                        onChange={(e) => {
                          setEditedNote({
                            ...editedNote,
                            items: editedNote.items?.map((i) =>
                              i.id === item.id
                                ? { ...i, text: e.target.value }
                                : i
                            ),
                          });
                        }}
                        className={cn(
                          "flex-1 border-none bg-transparent",
                          item.checked && "line-through text-muted-foreground"
                        )}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4" />
                    <Input
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      placeholder="Add a checklist item"
                      className="flex-1 border-none bg-transparent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddItem();
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddItem}
                      className="opacity-50 hover:opacity-100"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Note Color</h3>
                </div>
                <div className="flex gap-2">
                  {COLORS.map((color: string) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-8 h-8 rounded-full ${
                        color.split(" ")[0]
                      } border-2 ${color.split(" ")[1]} ${
                        editedNote.color === color
                          ? "ring-2 ring-offset-2 ring-blue-500"
                          : ""
                      }`}
                      onClick={() => setEditedNote({ ...editedNote, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 max-h-[300px] overflow-y-scroll scrollbar-hide">
            <div className="space-y-2">
              <h3 className="font-bold">{note.title}</h3>
              <p className="text-sm text-shadow-muted-foreground whitespace-pre-line">
                {note.content}
              </p>
              {note.items && note.items.length > 0 && (
                <div className="mt-2 space-y-1">
                  {note.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-4 h-4 border rounded-sm flex items-center justify-center",
                          item.checked
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        )}
                      >
                        {item.checked && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          item.checked && "line-through text-muted-foreground"
                        )}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {note.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 dark:text-blue-400 dark:bg-gray-950 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 group hover:bg-blue-200 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-2 text-xs text-muted-foreground">
              <p>{format(new Date(note.updatedAt), "do MMMM, yyyy")}</p>
            </div>

            <div className="items-center gap-2 mt-4 justify-end md:absolute md:bottom-2 md:right-2 flex md:group-hover:flex md:hidden">
              <div className={`h-4 w-4 rounded-full ${note.color}`}></div>
              <Trash2
                className="h-4 w-4 cursor-pointer"
                color="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
