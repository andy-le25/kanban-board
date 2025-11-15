"use client";

import { useState } from "react";

type CounterProps = {
    initial?: number;
};

export default function Counter({ initial = 0}: CounterProps) {
    const [count, setCount] = useState(initial);

    return (
        <div className = "flex items-center gap-2">
            <button
                className = "px-2 py-1 border rounded"
                onClick={() => setCount(count - 1)}
            >
                -
            </button>
            <span className = "min-w-[2rem] text-center">{count}</span>
            <button
                className = "px-2 py-1 border rounded"
                onClick = {() => setCount(count + 1)}
            >
                +
            </button>
        </div>
    );
}