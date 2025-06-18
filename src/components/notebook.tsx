import { useState, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Tag, X, ListTodo, Palette } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { LayoutGrid } from "./layout-grid";
import { ScrollArea } from "./ui/scroll-area";
import { useDebounce } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Checkbox } from "./ui/checkbox";

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color: string;
  tags: string[];
  items?: {
    id: string;
    text: string;
    checked: boolean;
  }[];
};

export const COLORS = [
  "bg-blue-200 border-blue-400",
  "bg-green-200 border-green-400",
  "bg-yellow-200 border-yellow-400",
  "bg-red-200 border-red-400",
  "bg-purple-200 border-purple-400",
  "bg-pink-200 border-pink-400",
];

const COLOR_NAMES = {
  "bg-blue-200 border-blue-400": "Blue",
  "bg-green-200 border-green-400": "Green",
  "bg-yellow-200 border-yellow-400": "Yellow",
  "bg-red-200 border-red-400": "Red",
  "bg-purple-200 border-purple-400": "Purple",
  "bg-pink-200 border-pink-400": "Pink",
};

export function Notebook() {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newNote, setNewNote] = useState<
    Omit<Note, "id" | "createdAt" | "updatedAt">
  >({
    title: "",
    content: "",
    color: COLORS[0],
    tags: [],
    items: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const prevNewNoteRef = useRef(newNote);
  const debouncedNewNote = useDebounce(newNote, 500);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Fetch notes from localStorage
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: () => {
      const savedNotes = localStorage.getItem("notes");
      return savedNotes ? JSON.parse(savedNotes) : [];
    },
  });

  // Get all unique tags from notes
  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags))
  ).sort();

  // Create a new note
  const createNote = useMutation({
    mutationFn: async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
      const newNote: Note = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...note,
      };
      const updatedNotes = [...notes, newNote];
      localStorage.setItem("notes", JSON.stringify(updatedNotes));
      return newNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setNewNote({
        title: "",
        content: "",
        color: COLORS[0],
        tags: [],
        items: [],
      });
      setIsModalOpen(false);
      toast.success("Your note has been saved successfully.");
    },
  });

  // Update a note
  const updateNote = useMutation({
    mutationFn: async (updatedNote: Note) => {
      const updatedNotes = notes.map((note) =>
        note.id === updatedNote.id ? updatedNote : note
      );
      localStorage.setItem("notes", JSON.stringify(updatedNotes));
      return updatedNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Your note has been updated successfully.");
    },
  });

  // Delete a note
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const updatedNotes = notes.filter((note) => note.id !== id);
      localStorage.setItem("notes", JSON.stringify(updatedNotes));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Your note has been deleted successfully.");
    },
  });

  // Reorder notes
  const moveNote = useMutation({
    mutationFn: async ({
      fromIndex,
      toIndex,
    }: {
      fromIndex: number;
      toIndex: number;
    }) => {
      const updatedNotes = [...notes];
      const [movedNote] = updatedNotes.splice(fromIndex, 1);
      updatedNotes.splice(toIndex, 0, movedNote);
      localStorage.setItem("notes", JSON.stringify(updatedNotes));
      return updatedNotes;
    },
    onSuccess: (updatedNotes) => {
      queryClient.setQueryData(["notes"], updatedNotes);
    },
  });

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setNewNote({
        ...newNote,
        items: [
          ...(newNote.items || []),
          {
            id: crypto.randomUUID(),
            text: newItem.trim(),
            checked: false,
          },
        ],
      });
      setNewItem("");
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setNewNote({
      ...newNote,
      items: newNote.items?.filter((item) => item.id !== itemId),
    });
  };

  const handleToggleItem = (itemId: string) => {
    setNewNote({
      ...newNote,
      items: newNote.items?.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    });
  };

  const handleClearFilters = () => {
    setSelectedColors([]);
    setSelectedTags([]);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newNote.tags.includes(newTag.trim())) {
      setNewNote({
        ...newNote,
        tags: [...newNote.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNote({
      ...newNote,
      tags: newNote.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const filteredNotes = notes
    .filter((note) => {
      if (selectedColors.length === 0 && selectedTags.length === 0) return true;
      const colorMatch =
        selectedColors.length === 0 || selectedColors.includes(note.color);
      const tagMatch =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => note.tags.includes(tag));
      return colorMatch && tagMatch;
    })
    .filter((note) => {
      if (!searchQuery) return true;
      return (
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    });

  // Reset form when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setNewNote({
        title: "",
        content: "",
        color: COLORS[0],
        tags: [],
        items: [],
      });
      setNewItem("");
      setNewTag("");
      prevNewNoteRef.current = {
        title: "",
        content: "",
        color: COLORS[0],
        tags: [],
        items: [],
      };
    }
  }, [isModalOpen]);

  // On open, create or update draft
  useEffect(() => {
    if (isModalOpen && newNote.title.trim()) {
      // If no draftId, create a new note
      if (!draftId) {
        const id = uuidv4();
        setDraftId(id);
        const newDraft = {
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...newNote,
        };
        const updatedNotes = [...notes, newDraft];
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      } else {
        // Update the draft note
        const updatedNotes = notes.map((note) =>
          note.id === draftId
            ? { ...note, ...newNote, updatedAt: new Date().toISOString() }
            : note
        );
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNewNote, isModalOpen]);

  // On close, remove draft if not saved
  useEffect(() => {
    if (!isModalOpen && draftId) {
      const updatedNotes = notes.filter((note) => note.id !== draftId);
      localStorage.setItem("notes", JSON.stringify(updatedNotes));
      setDraftId(null);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  // On save, clear draftId
  const handleSave = () => {
    if (newNote.title.trim()) {
      if (draftId) {
        // Update the draft as a real note
        const updatedNotes = notes.map((note) =>
          note.id === draftId
            ? { ...note, ...newNote, updatedAt: new Date().toISOString() }
            : note
        );
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
        setDraftId(null);
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        toast.success("Your note has been saved successfully.");
      } else {
        createNote.mutate(newNote);
      }
    } else {
      setIsModalOpen(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="px-4">
        <h1 className="text-4xl font-extrabold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-black dark:from-blue-300 dark:to-blue-600 pt-3">
          Notepad
        </h1>

        <div className="mt-1">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <p className="text-2xl font-extrabold">Your Notes</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-fit">
                    Create New Note
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-extrabold">
                      Create New Note
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          value={newNote.title}
                          onChange={(e) =>
                            setNewNote({ ...newNote, title: e.target.value })
                          }
                          placeholder="Note title"
                          className="font-medium border-none bg-transparent !text-lg placeholder:text-muted-foreground/50"
                        />
                        <Textarea
                          value={newNote.content}
                          onChange={(e) =>
                            setNewNote({
                              ...newNote,
                              content: e.target.value,
                            })
                          }
                          placeholder="Write your note here..."
                          className="min-h-[100px] resize-none border-none bg-transparent text-base placeholder:text-muted-foreground/50"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <h3 className="text-sm font-medium">Tags</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {newNote.tags.map((tag) => (
                            <motion.span
                              key={tag}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 group hover:bg-blue-200 transition-colors"
                            >
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-900"
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
                            {newNote.items?.length || 0} items
                          </div>
                        </div>
                        <div className="space-y-2">
                          {newNote.items?.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-2 group"
                            >
                              <Checkbox
                                checked={item.checked}
                                onCheckedChange={() =>
                                  handleToggleItem(item.id)
                                }
                              />
                              <Input
                                value={item.text}
                                onChange={(e) => {
                                  setNewNote({
                                    ...newNote,
                                    items: newNote.items?.map((i) =>
                                      i.id === item.id
                                        ? { ...i, text: e.target.value }
                                        : i
                                    ),
                                  });
                                }}
                                className={cn(
                                  "flex-1 border-none bg-transparent",
                                  item.checked &&
                                    "line-through text-muted-foreground"
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
                          {COLORS.map((color) => (
                            <motion.button
                              key={color}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-8 h-8 rounded-full ${
                                color.split(" ")[0]
                              } border-2 ${color.split(" ")[1]} ${
                                newNote.color === color
                                  ? "ring-2 ring-offset-2 ring-blue-500"
                                  : ""
                              }`}
                              onClick={() => setNewNote({ ...newNote, color })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="w-full mt-6"
                  >
                    {newNote.title.trim() ? "Save Note" : "Cancel"}
                  </Button>
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notes..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-fit h-fit">
                      <Filter className="md:mr-2 h-4 w-4" />
                      <span className="hidden md:block">Filters</span>
                      {(selectedColors.length > 0 ||
                        selectedTags.length > 0) && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                          {selectedColors.length + selectedTags.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <div className="p-2">
                      <h4 className="mb-2 text-sm font-medium">Colors</h4>
                      {COLORS.map((color) => (
                        <DropdownMenuCheckboxItem
                          key={color}
                          checked={selectedColors.includes(color)}
                          onCheckedChange={() => handleColorToggle(color)}
                        >
                          <span
                            className={`w-4 h-4 rounded-full ${
                              color.split(" ")[0]
                            } mr-2`}
                          />
                          {COLOR_NAMES[color as keyof typeof COLOR_NAMES]}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <h4 className="mb-2 text-sm font-medium">Tags</h4>
                      <ScrollArea className="h-[200px]">
                        {allTags.map((tag) => (
                          <DropdownMenuCheckboxItem
                            key={tag}
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => handleTagToggle(tag)}
                          >
                            <Tag className="mr-2 h-4 w-4" />
                            {tag}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </ScrollArea>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleClearFilters}
                      className="text-red-600"
                    >
                      Clear All Filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <LayoutGrid
              filteredNotes={filteredNotes}
              searchQuery={searchQuery}
              updateNote={updateNote}
              deleteNote={deleteNote}
              moveNote={moveNote}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
