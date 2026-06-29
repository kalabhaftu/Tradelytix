"use client"

import React, { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

interface GridConfig {
    numCards: number
    cols: number
    xBase: number
    yBase: number
    xStep: number
    yStep: number
}

const AnimatedLoadingSkeleton = () => {
    const [windowWidth, setWindowWidth] = useState(0)
    const controls = useAnimation()

    const getGridConfig = (width: number): GridConfig => {
        const numCards = 6
        const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1
        return {
            numCards,
            cols,
            xBase: 40,
            yBase: 60,
            xStep: 210,
            yStep: 230
        }
    }

    const generateSearchPath = (config: GridConfig) => {
        const { numCards, cols, xBase, yBase, xStep, yStep } = config
        const rows = Math.ceil(numCards / cols)
        const allPositions = []

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if ((row * cols + col) < numCards) {
                    allPositions.push({
                        x: xBase + (col * xStep),
                        y: yBase + (row * yStep)
                    })
                }
            }
        }

        const numRandomCards = 4
        const shuffledPositions = allPositions
            .sort(() => Math.random() - 0.5)
            .slice(0, numRandomCards)

        shuffledPositions.push(shuffledPositions[0]!)

        return {
            x: shuffledPositions.map(pos => pos.x),
            y: shuffledPositions.map(pos => pos.y),
            scale: Array(shuffledPositions.length).fill(1.2),
            transition: {
                duration: shuffledPositions.length * 2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1] as number[],
                times: shuffledPositions.map((_: { x: number; y: number }, i: number) => i / (shuffledPositions.length - 1))
            }
        }
    }

    useEffect(() => {
        setWindowWidth(window.innerWidth)
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const config = getGridConfig(windowWidth)
        controls.start(generateSearchPath(config))
    }, [windowWidth, controls])

    const frameVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
    }

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: (i: number) => ({
            y: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.4 }
        })
    }

    const glowVariants = {
        animate: {
            boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.2)",
                "0 0 35px hsl(var(--primary) / 0.4)",
                "0 0 20px hsl(var(--primary) / 0.2)"
            ],
            scale: [1, 1.1, 1],
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    }

    const config = getGridConfig(windowWidth)

    return (
        <motion.div
            className="w-full max-w-4xl mx-auto p-6 bg-card rounded-xl shadow-lg border border-border"
            variants={frameVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-muted/50 to-muted p-8">
                <motion.div
                    className="absolute z-10 pointer-events-none"
                    animate={controls}
                    style={{ left: 24, top: 24 }}
                >
                    <motion.div
                        className="bg-primary/20 p-3 rounded-full backdrop-blur-sm"
                        variants={glowVariants}
                        animate="animate"
                    >
                        <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </motion.div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(config.numCards)].map((_, i) => (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            className="bg-card rounded-lg shadow-sm p-4 border border-border"
                        >
                            <motion.div
                                className="h-32 bg-muted rounded-md mb-3"
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="h-3 w-3/4 bg-muted rounded mb-2"
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="h-3 w-1/2 bg-muted rounded"
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

export default AnimatedLoadingSkeleton
