import { styled } from '@apache-superset/core/theme';
import { keyframes } from '@apache-superset/core/theme';
import { css } from '@emotion/react';

interface ChatContainerProps {
  isCollapsed: boolean;
  panelWidth: number;
  isStandalone?: boolean;
}

interface ChatContentWrapperProps {
  isCollapsed: boolean;
}

interface MessageBubbleProps {
  role: string;
}

/* ✅ MAIN CONTAINER */
export const ChatContainer = styled.div<ChatContainerProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  width: ${({ isStandalone, isCollapsed, panelWidth }) =>
    isStandalone
      ? '100%'
      : isCollapsed
      ? '0px'
      : `${panelWidth}px`};
  overflow: visible;
  background-color: ${({ isStandalone, isCollapsed, theme }) =>
    !isStandalone && isCollapsed ? 'transparent' : theme.colorBgContainer};

  border-left: ${({ isStandalone, isCollapsed, theme }) =>
    !isStandalone && isCollapsed
      ? 'none'
      : `1px solid ${theme.colorBorderSecondary || theme.colorBorder}`};

  transition: width 0.15s ease-in-out;
  user-select: text;
`;

/* ✅ RESIZE HANDLE */
export const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  left: -2px;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  z-index: 20;

  &:hover {
    background-color: ${({ theme }) => theme.colorPrimary};
    opacity: 0.6;
  }
`;

export const SplitHandle = styled.div`
  position: absolute;
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  width: 12px;
  height: 40px;
  background-color: ${({ theme }) => theme.colorBgContainer};
  border: 1px solid ${({ theme }) => theme.colorBorder};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);

  &:hover {
    border-color: ${({ theme }) => theme.colorPrimary};
    color: ${({ theme }) => theme.colorPrimary};
  }
`;

/* ✅ Gemini-style flowing gradient */
const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

export const CollapsedEdgeTab = styled.div`
  position: absolute;
  top: 90%;
  right: 0;
  transform: translateY(-50%);
  height: 120px;
  width: 38px;
  border-radius: 10px 0 0 10px;
  padding: 2px;

  background: linear-gradient(120deg, #60a5fa, #a78bfa, #22d3ee, #60a5fa);
  background-size: 300% 300%;
  animation: ${gradientFlow} 4s linear infinite;

  display: flex;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease;

  & > span {
    background-color: ${({ theme }) => theme.colorBgContainer};
    border-radius: 8px 0 0 8px;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    writing-mode: vertical-rl;
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    font-weight: 600;
    color: ${({ theme }) => theme.colorTextSecondary};
    transition: color 0.2s ease;
  }

  /* ✅ FIXED HOVER */
  &:hover {
    transform: translateY(-50%) scale(1.04);   // ✅ scale container, NOT span
  }

  &:hover > span {
    color: ${({ theme }) => theme.colorPrimary};
  }
`;

/* ✅ CONTENT WRAPPER */
export const ChatContentWrapper = styled.div<ChatContentWrapperProps>`
  display: ${({ isCollapsed }) => (isCollapsed ? 'none' : 'flex')};
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

/* ✅ HEADER */
export const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 5;
  height: 45px;
  padding: 10px 16px 0 16px;
  background: ${({ theme }) => theme.colorBgContainer};
  border-bottom: 1px solid ${({ theme }) => theme.colorBorder};
  border-left: 1px solid ${({ theme }) => theme.colorBorder};
  box-sizing: border-box;
  box-shadow:
    inset 0 1px 0 ${({ theme }) => theme.colorBgElevated},
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 4px 12px ${({ theme }) => theme.colorFillSecondary};
`;

export const HeaderTitle = styled.span`
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.colorText};
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateZ(0);
  will-change: transform;
`;

export const CloseButton = styled.span`
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: ${({ theme }) => theme.colorTextSecondary};
  padding: 2px 6px;
  border-radius: 4px;

  &:hover {
    background-color: ${({ theme }) => theme.colorFillSecondary};
    color: ${({ theme }) => theme.colorText};
  }
`;

/* ✅ ANIMATIONS FOR THE BOT AVATAR */
export const botRing = keyframes`
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(1.4); opacity: 0; }
`;

export const botPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
`;

/* ✅ MOVING GLOSS EFFECT KEYFRAMES */
const glossMove = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

/* ✅ MESSAGE LIST CONTAINER */
export const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Add this keyframe at the top
const fadeInSlideUp = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

// Update MessageRow
export const MessageRow = styled.div<{ role: string; isContinued?: boolean }>`
  display: flex;
  justify-content: ${({ role }) => (role === 'user' ? 'flex-end' : 'flex-start')};
  /* Reduced margin if it's a continued message */
  margin-bottom: ${({ isContinued }) => (isContinued ? '4px' : '14px')};
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  /* Soft entrance animation */
  animation: ${fadeInSlideUp} 0.3s ease-out forwards;
`;

/* ✅ ROBOT AVATAR FRAME */
export const AvatarContainer = styled.div`
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colorBgElevated};
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary || theme.colorBorder};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.boxShadowSecondary || '0 2px 4px rgba(0,0,0,0.06)'};
  backdrop-filter: blur(8px);
  flex-shrink: 0;
  margin-top: 2px;
  position: relative;
`;

export const AvatarRing = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  border: 2px solid ${({ theme }) => theme.colorPrimary || '#1677ff'};
  animation: ${botRing} 2s cubic-bezier(0.25, 1, 0.2, 1) infinite;
  pointer-events: none;
`;

/* ✅ UPDATED: CHANGED TO IMG TAG FOR THE NATIVE PNG ASSET */
export const AvatarImg = styled.img<{ isLoading?: boolean }>`
  width: 15px;
  height: 15px;
  object-fit: contain;
  opacity: 0.92;

  ${({ isLoading }) =>
    isLoading &&
    css`
      animation: ${botPulse} 1.5s ease-in-out infinite;
    `}
`;

/* ✅ MESSAGE BUBBLE WITH FIXED TEXT-SELECTION AND NATIVE THEMING */
export const MessageBubble = styled.div<MessageBubbleProps>`
  max-width: 80%;
  min-width: 60px;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 10px;
  
  background-color: ${({ role, theme }) =>
    role === 'user' ? theme.colorPrimaryBg || '#e6f7ff' : theme.colorFillAlter || '#f5f5f5'};
  
  color: ${({ theme }) => theme.colorText || '#000000'};
  border: 1px solid ${({ theme }) => theme.colorBorder || '#d9d9d9'};
  
  overflow-wrap: anywhere;
  word-break: break-word;
  overflow: hidden;
  user-select: text !important;
  cursor: text;
  
  display: flex;
  flex-direction: column;
`;

/* ✅ TIMESTAMP BOX */
export const MessageTimestamp = styled.div`
  font-size: 11px;
  opacity: 0.5;
  margin-top: 6px;
  text-align: right;
  user-select: none;
`;

/* ✅ THINKING STATE BUBBLE */
export const ThinkingBubble = styled.div`
  max-width: 80%;
  padding: 10px 16px;
  box-sizing: border-box;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colorFillAlter || '#f5f5f5'};
  border: 1px solid ${({ theme }) => theme.colorBorder || '#d9d9d9'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ✅ NEW: HIGH-END MOVING GLOSS SHIMMER TEXT COMPONENT */
export const ThinkingText = styled.span`
  font-size: ${({ theme }) => theme.fontSizeSM || 12}px;
  font-weight: 500;
  letter-spacing: 0.3px;
  display: inline-block;

  background: linear-gradient(
    120deg,
    ${({ theme }) => theme.colorTextSecondary || '#7c7c7c'} 35%,
    ${({ theme }) => theme.colorText || '#111111'} 50%,
    ${({ theme }) => theme.colorTextSecondary || '#7c7c7c'} 65%
  );
  
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${glossMove} 2s infinite linear;
  user-select: none;
`;

/* ✅ INPUT AREA */
export const InputArea = styled.div`
  display: flex;
  align-items: center;
  padding: 6px;
  margin: 8px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colorFillSecondary};
  gap: 6px;
`;

/* ✅ INPUT */
export const ChatInput = styled.textarea<{ isStandalone?: boolean }>`
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSizeSM || 13}px;
  color: ${({ theme }) => theme.colorText};
  line-height: 1.5;
  max-height: ${({ isStandalone }) => (isStandalone ? '6em' : '12em')};
  overflow-y: auto;
`;

export const SendButton = styled.button<{ isDisabled?: boolean }>`
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;

  display: flex;
  align-items: center;
  justify-content: center;

  /* ✅ CONTROL CURSOR MANUALLY */
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};

  /* ✅ COLOR CONTROL */
  background-color: ${({ theme, isDisabled }) =>
    isDisabled ? theme.colorFillSecondary : theme.colorPrimary};

  color: ${({ theme, isDisabled }) =>
    isDisabled ? theme.colorTextDisabled : theme.colorTextLightSolid};

  transition: all 0.2s ease;

  &:hover {
    opacity: ${({ isDisabled }) => (isDisabled ? 1 : 0.85)};
  }

  /* ✅ disable pointer events (real safety) */
  pointer-events: ${({ isDisabled }) => (isDisabled ? 'none' : 'auto')};
`;

export const AttachmentButton = styled.label`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: ${({ theme }) => theme.colorTextSecondary};

  &:hover {
    background-color: ${({ theme }) => theme.colorFillSecondary};
  }

  input {
    display: none;
  }
`;

/* ✅ ACTION BUTTON */
export const ActionButton = styled.button`
  padding: 4px 12px;
  background-color: ${({ theme }) => theme.colorPrimary};
  color: ${({ theme }) => theme.colorTextLightSolid};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadiusSM || 4}px;
  font-size: ${({ theme }) => theme.fontSizeSM || 12}px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`; // 🌟 Added missing backtick and semicolon here!


/* ✅ MORPH ANIMATION KEYFRAMES */
/* ✅ HIGH DENSITY PARTICLE SYSTEM */
const swirlAssemble = keyframes`
  0% { transform: rotate(0deg) translateX(20px) scale(0.4); opacity: 0; }
  50% { transform: rotate(180deg) translateX(8px) scale(0.6); opacity: 1; }
  100% { transform: rotate(360deg) translateX(0px) scale(0); opacity: 0; }
`;

export const MorphContainer = styled.div`
  position: relative;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Particle = styled.div<{ delay: number }>`
  position: absolute;
  width: 3px;
  height: 3px;
  background-color: #ff0000;
  border-radius: 50%;
  animation: ${swirlAssemble} 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  animation-delay: ${({ delay }) => delay}s;
`;

export const LogoReveal = styled.img`
  width: 18px;
  height: 18px;
  object-fit: contain;
  /* Reusing the logoPop animation logic */
  animation: ${keyframes`
    0%, 35% { transform: scale(0); opacity: 0; filter: blur(4px); }
    42% { transform: scale(1.1); opacity: 1; filter: blur(0px); }
    50%, 80% { transform: scale(1); opacity: 1; filter: blur(0px); }
    90%, 100% { transform: scale(0); opacity: 0; filter: blur(4px); }
  `} 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
`;

export const SqlLinkText = styled.span`
  color: ${({ theme }) => theme.colorPrimary};
  cursor: pointer;
  font-weight: 600;
  display: inline-block;  // ✅ IMPORTANT for transform

  transition: transform 0.15s ease, opacity 0.15s ease;

  &:hover {
    transform: scale(1.08);   // ✅ zoom effect
    opacity: 0.9;             // ✅ subtle polish
  }

  &:active {
    transform: scale(0.96);   // ✅ click feedback (pro UX)
  }
`;