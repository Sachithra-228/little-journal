"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListTodo, Plus, X } from "lucide-react";
import { deleteTasks, fetchTasks, saveTask } from "@/lib/remote-storage";
import { cn, createId, toDateInputValue } from "@/lib/utils";
import type { DiaryTask } from "@/types/diary";

interface TaskListProps {
  journal: string;
  ownerPattern: string;
}

export function TaskList({ journal, ownerPattern }: TaskListProps) {
  const [tasks, setTasks] = useState<DiaryTask[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");
  const today = toDateInputValue();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTasks(journal, ownerPattern).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (result.ok) {
        // Tasks finished on an earlier day are no longer shown, so tidy them away.
        const stale = result.tasks.filter((task) => task.done && task.doneDate !== today);
        setTasks(result.tasks.filter((task) => !stale.includes(task)));
        setProblem("");
        if (stale.length) {
          deleteTasks(
            stale.map((task) => task.id),
            ownerPattern
          );
        }
      } else {
        setProblem(result.reason);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [journal, ownerPattern, today]);

  // Unfinished tasks from earlier days carry over; finished ones only stay for the day they were done.
  const visible = useMemo(() => {
    const shown = tasks.filter((task) => !task.done || task.doneDate === today);
    return [...shown.filter((task) => !task.done), ...shown.filter((task) => task.done)];
  }, [tasks, today]);
  const doneToday = visible.filter((task) => task.done);
  const progress = visible.length ? doneToday.length / visible.length : 0;

  async function persist(task: DiaryTask, previous: DiaryTask[]) {
    const result = await saveTask(task, ownerPattern);
    if (!result.ok) {
      setTasks(previous);
      setProblem(result.reason);
    }
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value) {
      return;
    }

    const task: DiaryTask = {
      id: createId("task"),
      journal,
      text: value,
      done: false,
      date: today,
      createdAt: new Date().toISOString()
    };
    const previous = tasks;
    setTasks([...tasks, task]);
    setText("");
    persist(task, previous);
  }

  function toggleTask(task: DiaryTask) {
    const updated: DiaryTask = {
      ...task,
      done: !task.done,
      doneDate: task.done ? undefined : today
    };
    const previous = tasks;
    setTasks(tasks.map((item) => (item.id === task.id ? updated : item)));
    persist(updated, previous);
  }

  async function removeTasks(ids: string[]) {
    const previous = tasks;
    setTasks(tasks.filter((task) => !ids.includes(task.id)));
    const result = await deleteTasks(ids, ownerPattern);
    if (!result.ok) {
      setTasks(previous);
      setProblem(result.reason);
    }
  }

  return (
    <section className="task-card" aria-labelledby="task-heading">
      <header className="task-head">
        <h3 id="task-heading">
          <ListTodo size={17} />
          Today&apos;s tasks
        </h3>
        {visible.length ? (
          <span className="task-count">
            {doneToday.length} of {visible.length} done
          </span>
        ) : null}
      </header>

      {visible.length ? (
        <div className="task-progress" aria-hidden="true">
          <motion.span animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      ) : null}

      <form className="task-add" onSubmit={addTask}>
        <label className="sr-only" htmlFor="task-input">
          New task
        </label>
        <input
          id="task-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What do you plan to do today?"
          maxLength={200}
          autoComplete="off"
        />
        <button type="submit" aria-label="Add task" disabled={!text.trim()}>
          <Plus size={18} />
        </button>
      </form>

      {problem ? <p className="form-error">{problem}</p> : null}
      {loading ? <p className="task-empty">Loading your tasks...</p> : null}
      {!loading && !visible.length && !problem ? (
        <p className="task-empty">Nothing planned yet. Add the first thing for today.</p>
      ) : null}

      <ul className="task-items">
        <AnimatePresence initial={false}>
          {visible.map((task) => (
            <motion.li
              key={task.id}
              layout
              className={cn("task-item", task.done && "done")}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
            >
              <button
                type="button"
                className="task-check"
                role="checkbox"
                aria-checked={task.done}
                aria-label={task.done ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
                onClick={() => toggleTask(task)}
              >
                {task.done ? <Check size={14} strokeWidth={3} /> : null}
              </button>
              <span className="task-text">
                {task.text}
                {!task.done && task.date < today ? <small>from earlier</small> : null}
              </span>
              <button
                type="button"
                className="task-delete"
                aria-label={`Delete "${task.text}"`}
                onClick={() => removeTasks([task.id])}
              >
                <X size={15} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {doneToday.length ? (
        <button
          type="button"
          className="task-clear"
          onClick={() => removeTasks(doneToday.map((task) => task.id))}
        >
          Clear {doneToday.length} done
        </button>
      ) : null}
    </section>
  );
}
