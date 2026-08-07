import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, Flag, MapPin, Languages, AlertTriangle } from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosinstance";
interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  location?: string;
  likes?: string[];
  dislikes?: string[];
  reports?: string[];
  isFlagged?: boolean;
  translatedBody?: string;
  targetLang?: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' }
];

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { user, otpData } = useUser();
  const [loading, setLoading] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [activeLangDropdown, setActiveLangDropdown] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(otpData?.locationString || null);

  const fetchUserLocation = async () => {
    if (userLocation) return;
    try {
      const res = await fetch('http://ip-api.com/json/');
      const data = await res.json();
      if (data.status === 'success') {
        setUserLocation(`${data.city}, ${data.regionName}`);
      } else {
        setUserLocation('Unknown Location');
      }
    } catch (err) {
      setUserLocation('Unknown Location');
    }
  };

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div>Loading history...</div>;
  }
  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        location: includeLocation && userLocation ? userLocation : undefined
      });
      if (res.data.comment && res.data.data) {
        const newCommentObj: Comment = res.data.data;
        setComments([newCommentObj, ...comments]);
        toast.success("Comment posted successfully");
      }
      setNewComment("");
      setIncludeLocation(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error adding comment");
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return toast.error("Please login to like comments");
    try {
      const res = await axiosInstance.post(`/comment/like/${commentId}`, { userId: user._id });
      setComments(comments.map(c => c._id === commentId ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!user) return toast.error("Please login to dislike comments");
    try {
      const res = await axiosInstance.post(`/comment/dislike/${commentId}`, { userId: user._id });
      setComments(comments.map(c => c._id === commentId ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (commentId: string) => {
    if (!user) return toast.error("Please login to report comments");
    try {
      const res = await axiosInstance.post(`/comment/report/${commentId}`, { userId: user._id });
      setComments(comments.map(c => c._id === commentId ? { ...c, isFlagged: res.data.isFlagged, reports: res.data.reports } : c));
      toast.success("Comment reported and flagged for review");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTranslate = async (comment: Comment, langCode: string) => {
    setTranslatingId(comment._id);
    setActiveLangDropdown(null);
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(comment.commentbody)}`);
      const data = await res.json();
      const translatedText = data[0].map((item: any) => item[0]).join('');
      setComments(comments.map(c => c._id === comment._id ? { ...c, translatedBody: translatedText, targetLang: langCode } : c));
    } catch (err) {
      toast.error("Translation failed");
      console.error(err);
    } finally {
      setTranslatingId(null);
    }
  };

  const revertTranslation = (commentId: string) => {
    setComments(comments.map(c => c._id === commentId ? { ...c, translatedBody: undefined, targetLang: undefined } : c));
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeLocation"
                  checked={includeLocation}
                  onChange={(e) => {
                    setIncludeLocation(e.target.checked);
                    if (e.target.checked && !userLocation) {
                      fetchUserLocation();
                    }
                  }}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="includeLocation" className="text-sm flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" /> Include my location {userLocation ? `(${userLocation})` : includeLocation ? "(Detecting...)" : ""}
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNewComment("");
                    setIncludeLocation(false);
                  }}
                  disabled={!newComment.trim()}
                >
                  Cancel
                </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                Comment
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>{comment.usercommented[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.usercommented}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                  {comment.location && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                      • <MapPin className="w-3 h-3" /> {comment.location}
                    </span>
                  )}
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2 mt-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={handleUpdateComment}
                        disabled={!editText.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{comment.usercommented}</p>
                      <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.commentedon))} ago</span>
                      {comment.isFlagged && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 rounded text-[11px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flagged for Review
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm mt-1">{comment.translatedBody || comment.commentbody}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <button onClick={() => handleLike(comment._id)} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200">
                        <ThumbsUp className={`w-4 h-4 ${comment.likes?.includes(user?._id) ? "fill-current text-blue-600" : ""}`} />
                        <span>{comment.likes?.length || 0}</span>
                      </button>
                      <button onClick={() => handleDislike(comment._id)} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200">
                        <ThumbsDown className={`w-4 h-4 ${comment.dislikes?.includes(user?._id) ? "fill-current text-red-600" : ""}`} />
                        <span>{comment.dislikes?.length || 0}</span>
                      </button>
                      
                      <div className="relative">
                        {comment.translatedBody ? (
                          <button 
                            onClick={() => revertTranslation(comment._id)} 
                            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200 text-primary font-medium"
                          >
                            <Languages className="w-4 h-4" />
                            <span>Show Original</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => setActiveLangDropdown(activeLangDropdown === comment._id ? null : comment._id)} 
                            disabled={translatingId === comment._id}
                            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200"
                          >
                            <Languages className="w-4 h-4" />
                            <span>{translatingId === comment._id ? "Translating..." : "Translate"}</span>
                          </button>
                        )}

                        {activeLangDropdown === comment._id && !comment.translatedBody && (
                          <div className="absolute left-0 mt-2 w-32 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-md shadow-lg z-10 py-1">
                            {LANGUAGES.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => handleTranslate(comment, lang.code)}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700"
                              >
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {comment.userid === user?._id && (
                        <>
                          <button onClick={() => handleEdit(comment)} className="hover:text-gray-900 dark:hover:text-gray-200">Edit</button>
                          <button onClick={() => handleDelete(comment._id)} className="hover:text-gray-900 dark:hover:text-gray-200">Delete</button>
                        </>
                      )}

                      <button 
                        onClick={() => handleReport(comment._id)} 
                        className={`flex items-center gap-1 hover:text-red-600 transition-colors ${comment.reports?.includes(user?._id) ? "text-red-500 font-semibold" : ""}`}
                        title="Report comment"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{comment.reports?.includes(user?._id) ? "Reported" : "Report"}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
