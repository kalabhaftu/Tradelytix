
import React from 'react'
import Image from 'next/image'
import { Control, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { LexicalEditor } from '@/components/ui/editor/lexical-editor'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Plus, X, Loader2 } from 'lucide-react'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { TradeImagesGallery } from './trade-images-gallery'

interface TradeNotesTabProps {
    control: Control<any>
    cardPreviewImage: string | null
    images: Record<string, string | null>
    onUpload: (field: string, file: File) => void
    onRemove: (field: string) => void
    imageErrors: Record<string, boolean>
    setImageError: (field: string, hasError: boolean) => void
    uploadingField: string | null
    chartLinks: string[]
    setChartLinks: (links: string[]) => void
}

const EMPTY_PARAGRAPH_NODE = {
    children: [
        {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "",
            type: "text",
            version: 1,
        },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
}

const EMPTY_LEXICAL_STATE = {
    root: {
        children: [{ ...EMPTY_PARAGRAPH_NODE }],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
    },
}

function normalizeToLexicalState(value?: string) {
    if (!value || value.trim() === "") return { ...EMPTY_LEXICAL_STATE }

    try {
        const parsed = JSON.parse(value)
        if (parsed?.root && Array.isArray(parsed.root.children)) {
            const children = parsed.root.children.length > 0
                ? parsed.root.children
                : [{ ...EMPTY_PARAGRAPH_NODE }]

            return {
                ...parsed,
                root: {
                    ...parsed.root,
                    children,
                },
            }
        }
    } catch {
        // fall through and wrap plain text
    }

    return {
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: value,
                            type: "text",
                            version: 1,
                        },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "paragraph",
                    version: 1,
                },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
        },
    }
}

function hasMeaningfulContent(value?: string) {
    if (!value) return false
    const trimmed = value.trim()
    if (!trimmed || trimmed === '<p></p>') return false

    try {
        const parsed = normalizeToLexicalState(value)
        const children = parsed?.root?.children || []
        if (children.length === 0) return false

        return children.some((node: any) => {
            const text = Array.isArray(node?.children)
                ? node.children.map((child: any) => String(child?.text || "")).join("")
                : ""
            return text.trim().length > 0
        })
    } catch {
        return true
    }
}

function isEmptyParagraphNode(node: any) {
    if (!node || node.type !== "paragraph" || !Array.isArray(node.children)) return false
    if (node.children.length === 0) return true
    return node.children.every((child: any) => String(child?.text || "").trim() === "")
}

function insertTemplateIntoNote(currentValue: string | undefined, templateState: any) {
    const currentState = normalizeToLexicalState(currentValue)
    const template = templateState?.root?.children ? templateState : normalizeToLexicalState(JSON.stringify(templateState))

    if (!hasMeaningfulContent(currentValue)) {
        return JSON.stringify(template)
    }

    const currentChildren = Array.isArray(currentState.root?.children) ? [...currentState.root.children] : [{ ...EMPTY_PARAGRAPH_NODE }]
    const templateChildren = Array.isArray(template.root?.children) ? [...template.root.children] : []

    if (currentChildren.length > 0 && !isEmptyParagraphNode(currentChildren[currentChildren.length - 1])) {
        currentChildren.push({ ...EMPTY_PARAGRAPH_NODE })
    }

    return JSON.stringify({
        ...currentState,
        root: {
            ...currentState.root,
            children: [...currentChildren, ...templateChildren],
        },
    })
}

export function TradeNotesTab({
    control,
    cardPreviewImage,
    images,
    onUpload,
    onRemove,
    imageErrors,
    setImageError,
    uploadingField,
    chartLinks,
    setChartLinks
}: TradeNotesTabProps) {
    return (
        <div className="space-y-8 px-1">
            {/* Trade Notes */}
            <div className="space-y-3">
                <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 sm:gap-2">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Trade Notes</h3>
                        <p className="text-xs text-muted-foreground">Document your thoughts, market conditions, and key takeaways.</p>
                    </div>
                    <Controller
                        name="comment"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] uppercase font-bold tracking-tight bg-muted/20 shrink-0"
                                    onClick={() => {
                                        field.onChange(insertTemplateIntoNote(field.value, {
                                                "root": {
                                                    "children": [
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Trade Thesis","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading","tag":"h3","version":1},
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Why did I take this trade? What was the higher timeframe context?","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Execution & Logic","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading","tag":"h3","version":1},
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Specific entry trigger, stop loss placement logic, and initial target reasoning.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Results & Management","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading","tag":"h3","version":1},
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"How did the trade play out? Did I manage it according to plan?","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Key Takeaways","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading","tag":"h3","version":1},
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"One thing I did well and one thing I could improve for next time.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}
                                                    ],
                                                    "direction":"ltr","format":"","indent":0,"type":"root","version":1
                                                }
                                            }))
                                    }}
                                >
                                    Standard Review
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] uppercase font-bold tracking-tight bg-muted/20 shrink-0"
                                    onClick={() => {
                                        field.onChange(insertTemplateIntoNote(field.value, {
                                                "root": {
                                                    "children": [
                                                        {"children":[{"detail":0,"format":1,"mode":"normal","style":"","text":"Emotional State:","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" Calm / Anxious / Greedy / FOMO","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"⚡ Focus Level (1-10): ","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":1,"mode":"normal","style":"","text":"Self-Discipline:","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" Did I follow my routine? Did I wait for my setup?","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":1,"mode":"normal","style":"","text":"Mental Notes:","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" Any external factors affecting my trading today?","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}
                                                    ],
                                                    "direction":"ltr","format":"","indent":0,"type":"root","version":1
                                                }
                                            }))
                                    }}
                                >
                                    Mental Check-in
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] uppercase font-bold tracking-tight bg-muted/20 shrink-0"
                                    onClick={() => {
                                        field.onChange(insertTemplateIntoNote(field.value, {
                                                "root": {
                                                    "children": [
                                                        {"children":[{"detail":0,"format":1,"mode":"normal","style":"","text":"HTF Bias:","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" Monthly/Weekly/Daily directional bias.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":1,"mode":"normal","style":"","text":"Entry Framework:","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" (e.g., MSS + FVG, Turtle Soup, etc.)","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":1,"mode":"normal","style":"","text":"Risk Management:","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" RR ratio, position sizing logic.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},
                                                        {"children":[{"detail":0,"format":1,"mode":"normal","style":"","text":"Correlation Check:","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" USDX, ES/NQ correlation at time of entry.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}
                                                    ],
                                                    "direction":"ltr","format":"","indent":0,"type":"root","version":1
                                                }
                                            }))
                                    }}
                                >
                                    Technical Breakdown
                                </Button>
                            </div>
                        )}
                    />
                </div>
                <Controller
                    name="comment"
                    control={control}
                    render={({ field }) => (
                        <LexicalEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="What did you see? What did you learn?"
                        />
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card Preview Image */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Featured Analysis</h3>
                        <p className="text-xs text-muted-foreground">The primary image shown in your journal feed.</p>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted/30 group">
                        {cardPreviewImage && String(cardPreviewImage).trim() !== '' ? (
                            <>
                                {!imageErrors.cardPreviewImage ? (
                                    <Image
                                        src={cardPreviewImage}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        loading="eager"
                                        onError={() => setImageError('cardPreviewImage', true)}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                        <X className="h-8 w-8 text-destructive/50 mb-2" />
                                        <p className="text-xs text-muted-foreground">Image link broken</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-4 px-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-9 px-4 text-xs font-semibold border-border bg-background/95 hover:bg-accent transition-all"
                                        onClick={() => {
                                            const input = document.createElement('input')
                                            input.type = 'file'
                                            input.accept = 'image/*'
                                            input.onchange = (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0]
                                                if (file) onUpload('cardPreviewImage', file)
                                            }
                                            input.click()
                                        }}
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-2" />
                                        Replace
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="h-9 px-4 text-xs font-semibold hover:bg-destructive/90 transition-all"
                                        onClick={() => onRemove('cardPreviewImage')}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <FileDropzone
                                variant="default"
                                onDrop={(files) => {
                                    const file = files[0]
                                    if (file) onUpload('cardPreviewImage', file)
                                }}
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                                className="h-full border-none bg-muted/50 hover:bg-muted/80"
                                description="Drag & drop or click to upload preview"
                                icon={<Plus className="h-8 w-8 text-muted-foreground/40 mb-2" />}
                                disabled={uploadingField === 'cardPreviewImage'}
                            />
                        )}
                        {uploadingField === 'cardPreviewImage' && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Screenshots - using the extracted component */}
                <TradeImagesGallery
                    images={images}
                    onUpload={(field, file) => onUpload(field, file)}
                    onRemove={(field) => onRemove(field)}
                    imageErrors={imageErrors}
                    setImageError={setImageError}
                    uploadingField={uploadingField}
                />
            </div>

            {/* Chart Links */}
            <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">Chart Analysis Links</h3>
                    <p className="text-xs text-muted-foreground">Add links to your TradingView chart analysis (up to 8)</p>
                </div>
                <div className="space-y-3 max-w-2xl">
                    {chartLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    placeholder="https://www.tradingview.com/x/..."
                                    value={link}
                                    onChange={(e) => {
                                        const newLinks = [...chartLinks]
                                        newLinks[index] = e.target.value
                                        setChartLinks(newLinks)
                                    }}
                                    className="text-sm h-9 bg-muted/20 border-border/50 focus:bg-background transition-all"
                                />
                            </div>
                            {index >= 4 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => {
                                        const newLinks = chartLinks.filter((_, i) => i !== index)
                                        setChartLinks(newLinks)
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {chartLinks.length < 8 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setChartLinks([...chartLinks, ''])}
                            className="w-full h-9 border-dashed border-border/60 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Analysis Link ({chartLinks.length}/8)
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
