import { createPortal } from 'react-dom';
import TradeChatScreen from './TradeChatScreen';

/** overflow 컨테이너(home__main) 밖 body에 렌더 — fixed 채팅창 클리pping 방지 */
export default function ChatOverlay(props) {
  return createPortal(<TradeChatScreen {...props} />, document.body);
}
