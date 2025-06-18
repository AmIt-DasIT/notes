"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Note } from "./notebook";
import Masonry from "react-masonry-css";
import { Dropzone } from "./dropzone";
import { ScrollArea } from "./ui/scroll-area";
import { NoteCard } from "./note-card";
import type { UseMutationResult } from "@tanstack/react-query";

export const LayoutGrid = ({
  filteredNotes,
  searchQuery,
  updateNote,
  deleteNote,
  moveNote,
}: {
  filteredNotes: Note[];
  searchQuery: string;
  updateNote: UseMutationResult<Note, Error, Note, unknown>;
  deleteNote: UseMutationResult<string, Error, string, unknown>;
  moveNote: UseMutationResult<
    Note[],
    Error,
    {
      fromIndex: number;
      toIndex: number;
    },
    unknown
  >;
}) => {
  const [selected, setSelected] = useState<Note | null>(null);
  const [lastSelected, setLastSelected] = useState<Note | null>(null);

  const handleClick = (card: Note) => {
    setLastSelected(selected);
    setSelected(card);
  };

  const handleOutsideClick = () => {
    setLastSelected(selected);
    setSelected(null);
  };

  console.log("selected", selected);

  const breakpointColumnsObj = {
    default: 6,
    1024: 2,
    640: 2,
  };

  return (
    <div className="space-y-4">
      {filteredNotes.length === 0 ? (
        <Dropzone onDrop={() => {}}>
          <div className="text-center py-12">
            <p className="">No notes found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery
                ? "Try a different search term"
                : "Create your first note"}
            </p>
          </div>
        </Dropzone>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex w-full gap-4"
            columnClassName="flex flex-col gap-4"
          >
            {filteredNotes.map((note, index) => (
              <div key={note.id} className="w-full break-inside-avoid">
                <NoteCard
                  note={note}
                  index={index}
                  onUpdate={(updatedNote) => updateNote.mutate(updatedNote)}
                  onDelete={(id) => {
                    deleteNote.mutate(id);
                  }}
                  onMove={(fromIndex, toIndex) =>
                    moveNote.mutate({ fromIndex, toIndex })
                  }
                  handleClick={handleClick}
                  selected={selected}
                  lastSelected={lastSelected}
                  setSelected={setSelected}
                />
              </div>
            ))}
          </Masonry>
        </ScrollArea>
      )}
      <motion.div
        onClick={handleOutsideClick}
        className={cn(
          "absolute h-full w-full left-0 top-0 bg-black opacity-0 z-10",
          selected?.id ? "pointer-events-auto" : "pointer-events-none"
        )}
        animate={{ opacity: selected?.id ? 0.3 : 0 }}
      />
    </div>
  );
};
