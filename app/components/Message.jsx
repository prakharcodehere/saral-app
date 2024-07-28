
export default function Message({ user, text }) {
      return (
        <div className="mb-2">
          <strong>{user}</strong>: {text}
        </div>
      );
    }
    