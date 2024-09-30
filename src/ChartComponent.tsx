import React, { useEffect, useRef, useState } from 'react';
import {
    createChart,
    CrosshairMode,
    IChartApi,
    ISeriesApi,
    UTCTimestamp,
} from 'lightweight-charts';

interface Candle {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

const ChartComponent: React.FC = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chart, setChart] = useState<IChartApi | null>(null);
    const [candleSeries, setCandleSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
    const [volumeSeries, setVolumeSeries] = useState<ISeriesApi<'Histogram'> | null>(null);
    const [data, setData] = useState<Candle[]>([]);

    useEffect(() => {
        if (chartContainerRef.current) {
            // Create the chart
            const chartInstance = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 600,
                layout: {
                    background: {
                        color: '#ffffff',
                    },
                    textColor: '#000',
                },
                grid: {
                    vertLines: {
                        color: '#e0e0e0',
                    },
                    horzLines: {
                        color: '#e0e0e0',
                    },
                },
                crosshair: {
                    mode: CrosshairMode.Normal,
                },
                rightPriceScale: {
                    scaleMargins: {
                        top: 0.2,
                        bottom: 0.2,
                    },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: true,
                },
            });

            // Add candlestick series
            const candleSeriesInstance = chartInstance.addCandlestickSeries();

            // Add volume histogram series with unique priceScaleId
            const volumeSeriesInstance = chartInstance.addHistogramSeries({
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: 'volume', // Assign a unique price scale ID
            });

            // Configure the price scale for the volume series
            chartInstance.priceScale('volume').applyOptions({
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
                visible: false,
            });

            setChart(chartInstance);
            setCandleSeries(candleSeriesInstance);
            setVolumeSeries(volumeSeriesInstance);

            // Handle resize
            const handleResize = () => {
                chartInstance.applyOptions({
                    width: chartContainerRef.current?.clientWidth ?? 0,
                });
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                chartInstance.remove();
            };
        }
    }, []);

    useEffect(() => {
        if (candleSeries && volumeSeries) {
            // Generate initial data
            const initialData = generateSampleData(100);
            setData(initialData);

            candleSeries.setData(initialData);
            volumeSeries.setData(
                initialData.map((d) => ({
                    time: d.time,
                    value: d.volume,
                    color:
                        d.close > d.open
                            ? 'rgba(0, 150, 136, 0.8)'
                            : 'rgba(255,82,82, 0.8)',
                }))
            );

            // Update data every second
            const interval = setInterval(() => {
                updateData();
            }, 1000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [candleSeries, volumeSeries]);

    const updateData = () => {
        setData((prevData) => {
            const newData = [...prevData];
            // Remove the oldest data point to keep the array size constant
            newData.shift();

            // Generate a new data point based on the last one
            const lastDataPoint = prevData[prevData.length - 1];
            const newDataPoint = generateRandomDataPoint(lastDataPoint);
            newData.push(newDataPoint);

            // Update the series with the new data point
            candleSeries?.update(newDataPoint);
            volumeSeries?.update({
                time: newDataPoint.time,
                value: newDataPoint.volume,
                color:
                    newDataPoint.close > newDataPoint.open
                        ? 'rgba(0, 150, 136, 0.8)'
                        : 'rgba(255,82,82, 0.8)',
            });

            return newData;
        });
    };

    return <div ref={chartContainerRef} />;
};

export default ChartComponent;

// Helper function to generate initial sample data
function generateSampleData(numPoints: number): Candle[] {
    const data: Candle[] = [];
    let time = (Math.floor(Date.now() / 1000) - numPoints * 1) as UTCTimestamp; // Use 1-second intervals
    let open = 100;

    for (let i = 0; i < numPoints; i++) {
        const close = open + (Math.random() - 0.5) * 2;
        const high = Math.max(open, close) + Math.random();
        const low = Math.min(open, close) - Math.random();
        const volume = Math.floor(Math.random() * 1000) + 500;

        data.push({
            time,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume,
        });

        open = close;
        time = (time + 1) as UTCTimestamp; // Increment time by 1 second
    }

    return data;
}

// Helper function to generate a new random data point
function generateRandomDataPoint(prevData: Candle): Candle {
    const time = (prevData.time + 1) as UTCTimestamp; // Increment time by 1 second
    const open = prevData.close;
    const close = open + (Math.random() - 0.5) * 2;
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();
    const volume = Math.floor(Math.random() * 1000) + 500;

    return {
        time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
    };
}
