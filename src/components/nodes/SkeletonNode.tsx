import { useAtom } from "../../lib/atom";
import { NodeAtoms } from "../../api";

export function SkeletonNode({ node }: { node: NodeAtoms }) {
  const [nodeBox] = useAtom(node.box);
  return (
    <div
      className="absolute rounded-xl bg-gray-300"
      style={{
        transform: `translateX(${nodeBox.x}px) translateY(${nodeBox.y}px)`,
        width: nodeBox.width,
        height: nodeBox.height,
      }}
    ></div>
  );
}
