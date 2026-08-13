import React, { useEffect, useRef } from 'react';
import { CardData } from '../types';

interface CanvasRendererProps {
  cardData: CardData;
  onCanvasRendered?: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  cardData,
  onCanvasRendered,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const targetWidth = cardData.format === 'A' ? 1080 : 1080;
  const targetHeight = cardData.format === 'A' ? 1080 : 1350;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    let isCancelled = false;

    // Helper to draw background
    const drawBackground = () => {
      // Warm parchment background
      ctx.fillStyle = '#F2F0EB';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Fine editorial grid lines
      ctx.strokeStyle = 'rgba(26, 26, 26, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < targetWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, targetHeight);
        ctx.stroke();
      }
      for (let y = 0; y < targetHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(targetWidth, y);
        ctx.stroke();
      }
    };

    const renderCard = (img: HTMLImageElement | null) => {
      if (isCancelled) return;

      ctx.clearRect(0, 0, targetWidth, targetHeight);
      drawBackground();

      if (cardData.format === 'A') {
        /* ================= FORMAT A: PFP FRAME (1080x1080) ================= */
        const centerX = targetWidth / 2;
        const centerY = targetHeight / 2 - 20;
        const radius = 380;

        // Outer subtle shadow halo
        ctx.fillStyle = 'rgba(26, 26, 26, 0.05)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
        ctx.fill();

        // Save context for circular photo clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Photo background fallback
        ctx.fillStyle = '#E8E5DC';
        ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

        if (img) {
          ctx.save();
          ctx.translate(
            centerX + (cardData.photoOffsetX / 100) * (radius * 0.8),
            centerY + (cardData.photoOffsetY / 100) * (radius * 0.8)
          );
          ctx.rotate((cardData.photoRotate * Math.PI) / 180);
          ctx.scale(cardData.photoScale, cardData.photoScale);

          const aspect = img.width / img.height;
          let drawW = radius * 2;
          let drawH = drawW / aspect;
          if (drawH < radius * 2) {
            drawH = radius * 2;
            drawW = drawH * aspect;
          }

          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        } else {
          // Placeholder icon/avatar
          ctx.fillStyle = '#1A1A1A';
          ctx.font = 'bold 36px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('DROP PORTRAIT PHOTO', centerX, centerY);
        }
        ctx.restore();

        // Outer Editorial Frame Ring
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 14, 0, Math.PI * 2);
        ctx.stroke();

        // Top Event Header Text Banner
        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '6px';
        ctx.fillText('HACKERS HOUSE · GOA 2026', centerX, 90);

        // Name Tag Overlay at bottom
        if (cardData.name) {
          ctx.fillStyle = '#1A1A1A';
          ctx.strokeStyle = '#1A1A1A';
          ctx.lineWidth = 2;

          const boxWidth = 620;
          const boxHeight = 96;
          const boxX = centerX - boxWidth / 2;
          const boxY = targetHeight - 175;

          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

          ctx.fillStyle = '#F2F0EB';
          ctx.font = 'bold 38px Georgia, "Playfair Display", serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cardData.name.toUpperCase(), centerX, boxY + boxHeight / 2 - (cardData.role ? 10 : 0));

          if (cardData.role) {
            ctx.fillStyle = '#A0522D';
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.fillText(cardData.role.toUpperCase(), centerX, boxY + boxHeight / 2 + 22);
          }
        }

        // Bottom Hashtag & Branding
        ctx.fillStyle = '#5A554C';
        ctx.font = '18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('#Shoreline', centerX, targetHeight - 45);

      } else {
        /* ================= FORMAT B: BUILDER ID CARD (1080x1350) ================= */

        // Card Outer Border
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 6;
        ctx.strokeRect(35, 35, targetWidth - 70, targetHeight - 70);

        // Inner Hairline
        ctx.strokeStyle = 'rgba(26, 26, 26, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(45, 45, targetWidth - 90, targetHeight - 90);

        // Header Section
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'bold 22px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText('HACKERS HOUSE · GOA 2026', 75, 90);

        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('PROJECT PASS #2026', targetWidth - 75, 90);

        // Header Divider
        ctx.strokeStyle = 'rgba(26, 26, 26, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(75, 115);
        ctx.lineTo(targetWidth - 75, 115);
        ctx.stroke();

        // Photo Frame Container
        const photoFrameX = 75;
        const photoFrameY = 145;
        const photoFrameW = targetWidth - 150;
        const photoFrameH = 500;

        ctx.fillStyle = '#E8E5DC';
        ctx.fillRect(photoFrameX, photoFrameY, photoFrameW, photoFrameH);

        // Clip Photo
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoFrameX, photoFrameY, photoFrameW, photoFrameH);
        ctx.clip();

        if (img) {
          ctx.save();
          const photoCenterX = photoFrameX + photoFrameW / 2 + (cardData.photoOffsetX / 100) * (photoFrameW * 0.4);
          const photoCenterY = photoFrameY + photoFrameH / 2 + (cardData.photoOffsetY / 100) * (photoFrameH * 0.4);

          ctx.translate(photoCenterX, photoCenterY);
          ctx.rotate((cardData.photoRotate * Math.PI) / 180);
          ctx.scale(cardData.photoScale, cardData.photoScale);

          const aspect = img.width / img.height;
          let drawW = photoFrameW;
          let drawH = drawW / aspect;
          if (drawH < photoFrameH) {
            drawH = photoFrameH;
            drawW = drawH * aspect;
          }

          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        } else {
          ctx.fillStyle = '#1A1A1A';
          ctx.font = 'bold 32px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('UPLOAD PORTRAIT', photoFrameX + photoFrameW / 2, photoFrameY + photoFrameH / 2);
        }
        ctx.restore();

        // Photo Frame Border Overlay
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 4;
        ctx.strokeRect(photoFrameX, photoFrameY, photoFrameW, photoFrameH);

        // Editorial Badge on Photo
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(photoFrameX + 20, photoFrameY + 20, 150, 36);
        ctx.fillStyle = '#F2F0EB';
        ctx.font = 'bold 13px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GOA EDITION', photoFrameX + 95, photoFrameY + 38);

        // Details Section
        const detailsY = photoFrameY + photoFrameH + 45;

        // Name
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'bold 54px Georgia, "Playfair Display", serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const displayName = (cardData.name || 'ANONYMOUS ATTENDEE').toUpperCase();
        ctx.fillText(displayName, 75, detailsY);

        // Role / Stack
        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 20px Arial, sans-serif';
        const displayRole = (cardData.role || 'FULL STACK DEVELOPER').toUpperCase();
        ctx.fillText(displayRole, 75, detailsY + 68);

        // Editorial Title Box
        const titleBoxY = detailsY + 120;
        const titleBoxW = targetWidth - 150;
        const titleBoxH = 120;

        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(75, titleBoxY, titleBoxW, titleBoxH);

        // Title Label
        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillText('AI BUILDER TITLE', 100, titleBoxY + 20);

        // Title Value
        ctx.fillStyle = '#F2F0EB';
        ctx.font = 'italic 34px Georgia, serif';
        const displayTitle = cardData.title ? `"${cardData.title}"` : '"The Async Alchemist"';
        ctx.fillText(displayTitle, 100, titleBoxY + 58);

        // Footer Section
        const footerY = targetHeight - 160;

        // Divider
        ctx.strokeStyle = 'rgba(26, 26, 26, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(75, footerY);
        ctx.lineTo(targetWidth - 75, footerY);
        ctx.stroke();

        // Barcode Simulation
        ctx.fillStyle = '#1A1A1A';
        const barcodeX = 75;
        const barcodeY = footerY + 25;
        const barcodeW = 280;
        const barcodeH = 45;

        let currX = barcodeX;
        while (currX < barcodeX + barcodeW) {
          const barWidth = Math.floor(Math.random() * 5) + 2;
          ctx.fillRect(currX, barcodeY, barWidth, barcodeH);
          currX += barWidth + Math.floor(Math.random() * 4) + 2;
        }

        ctx.fillStyle = '#5A554C';
        ctx.font = '13px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('SHORELINE-VERIFIED', barcodeX, barcodeY + barcodeH + 20);

        // Event Footer Metadata
        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 20px Georgia, serif';
        ctx.textAlign = 'right';
        ctx.fillText('#Shoreline', targetWidth - 75, barcodeY + 28);

        ctx.fillStyle = '#5A554C';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('#HHGoa2026', targetWidth - 75, barcodeY + 55);
      }

      // Notify parent of updated PNG dataUrl
      if (onCanvasRendered) {
        onCanvasRendered(canvas.toDataURL('image/png'));
      }
    };

    if (cardData.photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => renderCard(img);
      img.onerror = () => renderCard(null);
      img.src = cardData.photoUrl;
    } else {
      renderCard(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [cardData, targetWidth, targetHeight]);

  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden rounded-none border border-[#1A1A1A]/20 bg-[#FAF8F5] p-3 shadow-xl">
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '70vh',
          height: 'auto',
          aspectRatio: cardData.format === 'A' ? '1/1' : '1080/1350',
        }}
        className="block border border-[#1A1A1A]/10 shadow-lg transition-all duration-300"
      />
    </div>
  );
};
