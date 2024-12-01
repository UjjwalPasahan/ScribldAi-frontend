import { ColorSwatch, Group } from '@mantine/core';
import Button from './Button.jsx';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '../constants.js';

const Home = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FDFFAB');
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState();
  const [dictOfVars, setDictOfVars] = useState({});
  const [latexExpression, setLatexExpression] = useState([]);
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]); // Clear LaTeX expressions
      setResult(undefined);    // Clear result
      setDictOfVars({});       // Clear variable dictionary
      setLatexPosition({ x: 10, y: 200 }); // Reset position
      setReset(false);         // Reset the reset flag
    }
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
      }
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (result && result.expression && result.answer) {
      renderLatextoCanvas(result.expression, result.answer);
    }
  }, [result]);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
          window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
        } else if (window.MathJax.typeset) {
          window.MathJax.typeset(); // For newer versions of MathJax
        }
      }, 0);
    }
  }, [latexExpression]);

  const renderLatextoCanvas = (exp, ans) => {
    const latex = `\\(\\LARGE{${exp} = ${ans}}\\)`;
    setLatexExpression([...latexExpression, latex]);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  useEffect(()=>{
    isLoading ?<p className='text-white text-5xl'>Loading</p>: null
  },[isLoading])

  const sendData = async () => {
    setIsLoading(true);
    const canvas = canvasRef.current;
  
    if (canvas) {
      const response = await axios.post('https://scribld-ai-backend.vercel.app/?vercelToolbarCode=AfZERyK3wGBo0XU/calculate', {
        image: canvas.toDataURL('image/png').split(',')[1],
        dictOfVars: dictOfVars || {},
      });
  
      if (Array.isArray(response.data)) {
        response.data.forEach(item => {
          if (!item.error) {
            setResult({ expression: item.expr, answer: item.result });
            
            // Log the expression and answer immediately after setting the state
            console.log("Expression:", item.expr);
            console.log("Result:", item.result);
  
            if (item.assign) {
              setDictOfVars(prev => ({ ...prev, [item.expr.split('=')[0].trim()]: item.result }));
            }
          }
        });
      }
  
      setIsLoading(false);
  
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
  
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
  
      setLatexPosition({ x: centerX, y: centerY });
    }
  };
  

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        canvas.style.background = 'black'; // Reset the background
      }
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = '#000';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  return (
    <>
      <div className='relative p-6 gap-10 z-20 flex bg-[#333] justify-around items-center top-5 left-5 rounded-md w-44 flex-col'>
        <Button
          fn={() => setReset(true)}  // Trigger reset
          classes={'px-2 py-1 rounded-xl cursor-pointer w-full text-center text-[#444] bg-white'}
          color={''}
          text={'Reset'}
        />

        <Group>
          {SWATCHES.map((swatch) => (
            <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
          ))}
        </Group>

        <Button
          fn={sendData}
          classes={'px-2 py-1 rounded-xl cursor-pointer w-full text-center text-[#444] bg-white'}
          color={''}
          text={'Generate'}
        />
      </div>

      <canvas
        ref={canvasRef}
        id='canvas'
        className='absolute top-0 left-0 w-full h-full z-10'
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />

      {latexExpression && latexExpression.map((latex, index) => (
        <Draggable
          key={index}
          defaultPosition={latexPosition}
          onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
        >
          <div className="absolute p-2 text-white rounded shadow-md z-50">
            <div className="latex-content">{latex}</div>
          </div>
        </Draggable>
      ))}
    </>
  );
};

export default Home;
