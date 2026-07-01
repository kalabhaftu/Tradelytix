'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { TradeType } from '@/lib/db/schema/trades';

const newMappings: { [key: string]: string } = {
    "AccountNumber": "accountNumber",
    "Instrument": "instrument",
    "Fill Size": "quantity",
    "Trade P&L": "pnl",
    "Trade Life Span": "timeInPosition",
    "Commission & Fees": "commission",
    "Entry Buy/Sell": "side",
    "Entry Order Number": "entryId",
    "Entry Price": "entryPrice",
    "Entry Time": "entryDate",
    "Exit Order Number": "closeId",
    "Exit Price": "closePrice",
    "Exit Time": "closeDate",
}

interface PlatformProcessorProps {
    csvData: string[][]
    headers: string[]
    setProcessedTrades: React.Dispatch<React.SetStateAction<TradeType[]>>
    accountNumber: string
    processedTrades?: TradeType[]
}

export default function RithmicPerformanceProcessor({ headers, csvData, processedTrades = [], setProcessedTrades, accountNumber }: PlatformProcessorProps) {

    const processTrades = useCallback(() => {
        const newTrades: TradeType[] = [];
        const fallbackAccountNumber = accountNumber || 'default-account';

        csvData.forEach(row => {
            const item: Partial<TradeType> = {};
            let quantity = 0;
            headers.forEach((header, index) => {
                const mappingKey = Object.keys(newMappings).find(key => header.includes(key));
                if (mappingKey) {
                    const key = newMappings[mappingKey] as keyof TradeType;
                    const cellValue = row[index];
                    switch (key) {
                        case 'quantity':
                            quantity = parseFloat(cellValue || '0') || 0;
                            item[key] = quantity;
                            break;
                        case 'pnl':
                            const pnl = parseFloat(cellValue || '0') || 0;
                            item[key] = pnl;
                            break;
                        case 'commission':
                            item[key] = parseFloat(cellValue || '0') || 0;
                            break;
                        case 'timeInPosition':
                            item[key] = parseFloat(cellValue || '0') || 0;
                            break;
                        default:
                            (item as Record<string, any>)[key] = cellValue;
                    }
                }
            });

            try {
                if (item.entryDate) {
                    item.entryDate = new Date(item.entryDate).toISOString();
                }
                if (item.closeDate) {
                    item.closeDate = new Date(item.closeDate).toISOString();
                }
            } catch (e) {
                toast.error("Error", {
                    description: "There was an error processing the trades. Please check the data and try again."
                })
                return;
            }

            if (item.side === 'B' || item.side === 'S') {
                item.side = item.side === 'B' ? 'Long' : 'Short';
            }

            if (item.instrument) {
                item.instrument = item.instrument.slice(0, -2)
            }
            item.userId = ''
            if (!item.accountNumber) {
                item.accountNumber = fallbackAccountNumber;
            }
            item.id = `${item.entryId}-${item.closeId}`;
            newTrades.push(item as TradeType);
        });

        setProcessedTrades(newTrades);
    }, [csvData, headers, setProcessedTrades, accountNumber]);

    useEffect(() => {
        processTrades();
    }, [processTrades]);

    const totalPnL = useMemo(() => processedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0), [processedTrades]);
    const totalCommission = useMemo(() => processedTrades.reduce((sum, trade) => sum + (trade.commission || 0), 0), [processedTrades]);
    const uniqueInstruments = useMemo(() => Array.from(new Set(processedTrades.map(trade => trade.instrument))), [processedTrades]);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-2">Processed Trades</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Instrument</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Entry Price</TableHead>
                            <TableHead>Close Price</TableHead>
                            <TableHead>Entry Date</TableHead>
                            <TableHead>Close Date</TableHead>
                            <TableHead>PnL</TableHead>
                            <TableHead>Time in Position</TableHead>
                            <TableHead>Commission</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processedTrades.map((trade) => (
                            <TableRow key={trade.id}>
                                <TableCell>{trade.instrument}</TableCell>
                                <TableCell>{trade.side}</TableCell>
                                <TableCell>{trade.quantity}</TableCell>
                                <TableCell>{trade.entryPrice}</TableCell>
                                <TableCell>{trade.closePrice || '-'}</TableCell>
                                <TableCell>{trade.entryDate ? new Date(trade.entryDate).toLocaleString() : '-'}</TableCell>
                                <TableCell>{trade.closeDate ? new Date(trade.closeDate).toLocaleString() : '-'}</TableCell>
                                <TableCell className={trade.pnl && trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {trade.pnl?.toFixed(2)}
                                </TableCell>
                                <TableCell>{`${Math.floor((trade.timeInPosition || 0) / 60)}m ${Math.floor((trade.timeInPosition || 0) % 60)}s`}</TableCell>
                                <TableCell>{trade.commission?.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-between">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Total PnL</h3>
                    <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalPnL.toFixed(2)}
                    </p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Total Commission</h3>
                    <p className="text-xl font-bold text-blue-600">
                        {totalCommission.toFixed(2)}
                    </p>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">Instruments Traded</h3>
                <div className="flex flex-wrap gap-2">
                    {uniqueInstruments.map((instrument) => (
                        <Button
                            key={instrument}
                            variant="outline"
                        >
                            {instrument}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
