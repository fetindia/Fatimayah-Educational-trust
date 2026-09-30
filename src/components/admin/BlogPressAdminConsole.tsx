/**
 * @license
 * Blog, Press & Media Management Console with Delegated Access Control
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Newspaper, 
  Plus, 
  Search, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Eye, 
  Clock, 
  FileText, 
  Globe, 
  Share2, 
  Tag, 
  User, 
  Calendar,
  X,
  UserPlus,
  ShieldCheck,
  Filter,
  Save,
  Send,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  EyeOff
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db, cleanFirestoreData, logAuditEvent } from '../../lib/firebase';
import { validateImageFile, uploadCampaignMedia } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, UserRole, AppPermission } from '../../types';
import { NewsArticle } from '../home/NewsBlogReaderModal';

export const DEFAULT_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    title: '32nd Annual Convocation & Merit Scholarship Awards 2026 Concluded',
    category: 'Scholarship Alert',
    date: 'August 12, 2026',
    summary: 'FET distributed higher education grants and computing devices to over 1,200 deserving undergraduate candidates across India.',
    content: 'The 32nd Annual Convocation and Merit Scholarship Awards organized by the Fatimyah Educational Trust concluded with resounding success. Dignitaries, community trustees, educational benefactors, and hundreds of aspiring students convened at the central auditorium to witness the felicitation of 1,200+ undergraduate and polytechnic candidates.\n\nSpeaking at the convocation, the Board of Trustees reaffirmed their dedication to ensuring zero dropouts due to socioeconomic constraints. Scholarship disbursements covering full tuition fees, annual hostel stipends, and specialized coaching grants were handed over to meritorious scholars from engineering, medical, law, and administrative civil service streams.\n\nIn addition to academic fee coverage, 150 high-performance laptop units and digital research kits were gifted to meritorious STEM candidates to bolster technical skills and professional competitiveness.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
    author: 'FET Editorial Bureau',
    readTime: '4 min read',
    tag: 'Official Dispatch',
    status: 'published'
  },
  {
    id: 'news-2',
    title: 'State-Level Talent Search Examination 2026: Hall Tickets Released',
    category: 'Examination',
    date: 'July 29, 2026',
    summary: 'Registered candidates can now access and download their computerized hall tickets for the upcoming screening evaluation.',
    content: 'The Central Examination Board of Fatimyah Educational Trust has officially released the computerized Admit Cards and Hall Tickets for the State-Level Talent Search Examination (TSE) 2026.\n\nStudents registered across all accredited government and private higher secondary schools can access their hall ticket by logging into the student portal using their unique Application Tracking Number and registered date of birth.\n\nKey examination dates, test centers across Maharashtra, Gujarat, Uttar Pradesh, and Telangana, and reporting guidelines have been communicated via SMS and official dispatch notices. Candidates are advised to report 45 minutes prior to the commencement of the evaluation with an approved photo identity proof.',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    author: 'Examination Bureau',
    readTime: '3 min read',
    tag: 'Exam Update',
    status: 'published'
  },
  {
    id: 'news-3',
    title: 'Bridging the Higher Education Deficit: 30 Years of Targeted Merit Aid in India',
    category: 'Research & Policy',
    date: 'July 15, 2026',
    summary: 'An empirical analysis of how direct fee sponsorships and laptop allocations boost graduation and employment rates in minority communities.',
    content: 'A comprehensive longitudinal research briefing published by the FET Policy Secretariat evaluates the demonstrable socio-economic mobility generated through targeted merit scholarship pipelines over three consecutive decades.\n\nData compiled from 1994 through 2024 reveals that direct institutional fee sponsorships, when paired with continuous academic mentoring and job placement linkages, result in a 92% degree completion rate among first-generation scholars. Moreover, over 78% of supported candidates secured skilled professional appointments in healthcare, software engineering, academia, and civil administration within 12 months of graduation.\n\nThe whitepaper advocates for widespread modernization of community trusts into formalized digital governance platforms equipped with transparent Section 80G tracking and real-time disbursement audits.',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    author: 'FET Research Secretariat',
    readTime: '5 min read',
    tag: 'Policy Whitepaper',
    status: 'published'
  }
];

interface BlogPressAdminConsoleProps {
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const BlogPressAdminConsole: React.FC<BlogPressAdminConsoleProps> = ({ onNotify }) => {
  const { currentUser, userProfile, isSuperAdmin, activeRole, hasPermission } = useAuth();
  
  // Articles state initialized with verified default articles
  const [articles, setArticles] = useState<NewsArticle[]>(DEFAULT_NEWS_ARTICLES);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'unpublished'>('all');
  
  // Delegated Access & Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [delegatingUserId, setDelegatingUserId] = useState<string | null>(null);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editingArticleDate, setEditingArticleDate] = useState<string | null>(null);
  const [editingArticleStatus, setEditingArticleStatus] = useState<'published' | 'draft' | 'unpublished'>('published');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('News & Announcements');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [readTime, setReadTime] = useState('3 min read');
  const [tag, setTag] = useState('Official Bulletin');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Delete Confirmation Modal state
  const [deleteConfirmArticle, setDeleteConfirmArticle] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingArticle, setIsDeletingArticle] = useState(false);

  // Image Source Options State (Upload Image vs. Image URL / Link)
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'url'>('upload');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [urlInputValue, setUrlInputValue] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Article preview modal
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);

  // Check RBAC permissions for publishing
  const hasBlogRole = isSuperAdmin ||
                      activeRole === 'super_admin' || 
                      activeRole === 'administrator' ||
                      activeRole === 'blog_admin' || 
                      activeRole === 'content_admin' || 
                      (userProfile?.roles?.some(r => r === 'blog_admin' || r === 'content_admin' || r === 'administrator' || r === 'super_admin') ?? false) ||
                      userProfile?.primaryRole === 'super_admin' ||
                      userProfile?.primaryRole === 'administrator' ||
                      userProfile?.primaryRole === 'blog_admin' ||
                      userProfile?.primaryRole === 'content_admin' ||
                      Boolean(userProfile?.roles?.includes('super_admin')) ||
                      (currentUser?.email ? (
                        currentUser.email.toLowerCase().includes('admin') || 
                        currentUser.email.toLowerCase() === 'admin@fetindia.com' ||
                        currentUser.email.toLowerCase() === 'fetkofficial@gmail.com'
                      ) : false);

  const hasPerm = (p: AppPermission): boolean => {
    if (isSuperAdmin || hasBlogRole) return true;
    if (hasPermission && hasPermission(p)) return true;
    if (userProfile?.permissions?.includes(p)) return true;
    if (userProfile?.customPermissions?.includes(p)) return true;
    return false;
  };

  const canCreate = isSuperAdmin || hasBlogRole || hasPerm('blog.create') || hasPerm('content.publish');
  const canEdit = isSuperAdmin || hasBlogRole || hasPerm('blog.edit') || hasPerm('content.publish');
  const canPublish = isSuperAdmin || hasBlogRole || hasPerm('blog.publish') || hasPerm('press.publish') || hasPerm('news.publish') || hasPerm('content.publish');
  const canOperateBlog = canCreate || canEdit || canPublish;

  const showLocalNotice = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification(msg);
    if (onNotify) onNotify(msg, type);
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Fetch News & Articles from Firestore with fallback baseline
  useEffect(() => {
    let isMounted = true;
    try {
      const unsub = onSnapshot(
        collection(db, 'news'),
        (snapshot) => {
          const list: NewsArticle[] = [];
          const firestoreDocIds = new Set<string>();
          const firestoreTitles = new Set<string>();

          snapshot.forEach((d) => {
            const data = d.data();
            firestoreDocIds.add(d.id);
            if (data.title) firestoreTitles.add(data.title.toLowerCase().trim());

            // If explicitly deleted or archived, skip from active list
            if (data.status === 'deleted' || data.isDeleted) {
              return;
            }

            list.push({
              id: d.id,
              title: data.title || 'Untitled Dispatch',
              category: data.category || 'General',
              date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              summary: data.summary || '',
              content: data.content || '',
              author: data.author || 'FET Editorial Bureau',
              readTime: data.readTime || '3 min read',
              imageUrl: data.imageUrl || '',
              tag: data.tag || 'Official Bulletin',
              status: (data.status === 'draft' ? 'draft' : data.status === 'unpublished' ? 'unpublished' : 'published')
            });
          });

          // Merge baseline default articles if not shadowed by a Firestore record or marked deleted
          for (const def of DEFAULT_NEWS_ARTICLES) {
            if (!firestoreDocIds.has(def.id) && !firestoreTitles.has(def.title.toLowerCase().trim())) {
              list.push(def);
            }
          }

          if (isMounted) {
            setArticles(list);
            setIsLoadingArticles(false);
          }
        },
        (err) => {
          console.warn('News subscription notice:', err);
          if (isMounted) {
            setArticles(DEFAULT_NEWS_ARTICLES);
            setIsLoadingArticles(false);
          }
        }
      );
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      if (isMounted) {
        setArticles(DEFAULT_NEWS_ARTICLES);
        setIsLoadingArticles(false);
      }
    }
  }, []);

  // 2. Fetch Users for Super Admin Delegation
  useEffect(() => {
    if (!isSuperAdmin) return;
    let isMounted = true;
    try {
      const unsub = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const uList: UserProfile[] = [];
          snapshot.forEach((d) => {
            uList.push({ uid: d.id, ...d.data() } as UserProfile);
          });
          if (isMounted) setUsers(uList);
        },
        (err) => {
          console.warn('Users subscription notice for blog delegation:', err);
        }
      );
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      console.warn('Could not load users for delegation:', e);
    }
  }, [isSuperAdmin]);

  // Clean form state reset
  const resetForm = () => {
    setEditingArticleId(null);
    setEditingArticleDate(null);
    setEditingArticleStatus('published');
    setTitle('');
    setCategory('News & Announcements');
    setSummary('');
    setContent('');
    setImageUrl('');
    setUrlInputValue('');
    setUploadedFileName('');
    setImageSourceMode('upload');
    setReadTime('3 min read');
    setTag('Official Bulletin');
    setFormError(null);
    setImageError(null);
    setIsImageUploading(false);
    setImageUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open editor for creating or editing
  const handleOpenEditor = (article?: NewsArticle) => {
    if (article ? !canEdit : !canCreate) {
      showLocalNotice('Permission Denied: You do not have permissions for this action.', 'error');
      return;
    }
    resetForm();

    if (article) {
      setEditingArticleId(article.id);
      setEditingArticleDate(article.date || null);
      setEditingArticleStatus(article.status === 'draft' ? 'draft' : article.status === 'unpublished' ? 'unpublished' : 'published');
      setTitle(article.title || '');
      setCategory(article.category || 'News & Announcements');
      setSummary(article.summary || '');
      setContent(article.content || '');
      setImageUrl(article.imageUrl || '');
      setUrlInputValue(article.imageUrl || '');
      // Automatically detect if existing image is an external URL
      const isExternalUrl = Boolean(article.imageUrl && /^https?:\/\//i.test(article.imageUrl));
      setImageSourceMode(isExternalUrl ? 'url' : 'upload');
      setReadTime(article.readTime || '3 min read');
      setTag(article.tag || (article.status === 'draft' ? 'Draft' : 'Official Bulletin'));
    }
    setIsEditorOpen(true);
  };

  // Image Handling: Upload Option
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate using project's validateImageFile rules
    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image file.');
      return;
    }

    setImageError(null);
    setIsImageUploading(true);
    setImageUploadProgress(15);

    try {
      const result = await uploadCampaignMedia(file, 'covers', (progress) => {
        setImageUploadProgress(progress);
      });
      setImageUrl(result.url);
      setUploadedFileName(result.fileName || file.name);
      setUrlInputValue('');
    } catch (err: any) {
      console.error('Error uploading blog image:', err);
      setImageError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image file.');
      return;
    }

    setImageError(null);
    setIsImageUploading(true);
    setImageUploadProgress(15);

    try {
      const result = await uploadCampaignMedia(file, 'covers', (progress) => {
        setImageUploadProgress(progress);
      });
      setImageUrl(result.url);
      setUploadedFileName(result.fileName || file.name);
      setUrlInputValue('');
    } catch (err: any) {
      console.error('Error uploading dropped image:', err);
      setImageError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsImageUploading(false);
    }
  };

  // Image Handling: Direct URL Option
  const handleUrlInputChange = (val: string) => {
    setUrlInputValue(val);
    setImageError(null);
    const trimmed = val.trim();
    if (!trimmed) {
      setImageUrl('');
      return;
    }
    // Validation for web protocol
    if (!/^https?:\/\//i.test(trimmed)) {
      setImageError('URL must start with http:// or https://');
      return;
    }
    try {
      new URL(trimmed);
      setImageUrl(trimmed);
      setUploadedFileName('');
    } catch {
      setImageError('Please enter a valid, complete web URL.');
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setUrlInputValue('');
    setUploadedFileName('');
    setImageError(null);
    setImageUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save Article (Create or Update: Draft, Published, or Unpublished)
  const handleSaveArticle = async (targetStatus: 'published' | 'draft' | 'unpublished') => {
    if (targetStatus === 'published' && !canPublish) {
      setFormError('Access Denied: You are not authorized to publish.');
      return;
    }
    if (targetStatus === 'draft' && (!canCreate && !canEdit)) {
      setFormError('Access Denied: You are not authorized to save drafts.');
      return;
    }
    if (targetStatus === 'unpublished' && !canPublish) {
      setFormError('Access Denied: You are not authorized to unpublish.');
      return;
    }
    if (!title.trim()) {
      setFormError('Article headline/title is required.');
      return;
    }
    
    // For published articles, require summary or derive from content
    const effectiveSummary = summary.trim() || (content.trim().slice(0, 160) + (content.trim().length > 160 ? '...' : ''));
    if (!effectiveSummary.trim() && targetStatus === 'published') {
      setFormError('Summary preview or article content is required to publish.');
      return;
    }

    // Auto-normalize image URL if user omitted http/https prefix
    let normalizedUrl = urlInputValue.trim();
    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl) && !normalizedUrl.startsWith('data:image/')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const articleDocId = editingArticleId || `news-${Date.now()}`;
      const nowFormatted = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const authorName = userProfile?.fullLegalName || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'FET Editorial Bureau';

      // Keep original date if updating an already published article; otherwise set to current date
      const articleDate = (editingArticleId && editingArticleDate && !(editingArticleStatus === 'draft' && targetStatus === 'published'))
        ? editingArticleDate
        : nowFormatted;

      const existingArticle = articles.find(a => a.id === editingArticleId);
      const finalImageUrl = (imageSourceMode === 'url' ? (normalizedUrl || imageUrl.trim()) : (imageUrl.trim() || normalizedUrl)) || existingArticle?.imageUrl || '';

      const finalSummary = effectiveSummary.trim() || 'Institutional draft bulletin in preparation.';
      const finalContent = content.trim() || finalSummary;

      const payload = cleanFirestoreData({
        id: articleDocId,
        title: title.trim(),
        category: category.trim() || 'News & Announcements',
        summary: finalSummary,
        content: finalContent,
        author: authorName,
        readTime: readTime.trim() || '3 min read',
        imageUrl: finalImageUrl,
        tag: tag.trim() || (targetStatus === 'draft' ? 'Draft' : 'Official Bulletin'),
        status: targetStatus,
        updatedAt: new Date().toISOString(),
        date: articleDate
      });

      const newsRef = doc(db, 'news', articleDocId);
      await setDoc(newsRef, payload, { merge: true });

      try {
        const postsRef = doc(db, 'posts', articleDocId);
        await setDoc(postsRef, payload, { merge: true });
      } catch {
        // Non-blocking dual sync
      }

      try {
        await logAuditEvent({
          actorUid: currentUser?.uid || 'system',
          actorEmail: currentUser?.email || '',
          actorRole: activeRole || 'blog_admin',
          action: editingArticleId 
            ? (targetStatus === 'draft' ? 'BLOG_DRAFT_UPDATED' : (targetStatus === 'unpublished' ? 'BLOG_ARTICLE_DEACTIVATED' : 'BLOG_ARTICLE_UPDATED'))
            : (targetStatus === 'draft' ? 'BLOG_DRAFT_CREATED' : 'BLOG_ARTICLE_CREATED'),
          targetEntity: 'news',
          targetId: articleDocId,
          details: {
            title: title.trim(),
            status: targetStatus,
            authorName
          }
        });
      } catch (auditErr) {
        console.warn('Audit log write handled (non-blocking):', auditErr);
      }

      if (targetStatus === 'draft') {
        showLocalNotice(
          editingArticleId 
            ? `Draft "${title.trim()}" saved.` 
            : `Draft "${title.trim()}" saved to drafts.`,
          'info'
        );
      } else if (targetStatus === 'unpublished') {
        showLocalNotice(`Article "${title.trim()}" saved as unpublished (inactive).`, 'info');
      } else {
        showLocalNotice(
          editingArticleId 
            ? `Article "${title.trim()}" updated and live on website.` 
            : `New bulletin "${title.trim()}" published to FET India website.`,
          'success'
        );
      }

      setIsEditorOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Error saving article:', err);
      setFormError(err?.message || 'Failed to save article. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Action: Toggle Publish / Unpublish status directly from the management table
  const handleTogglePublishStatus = async (article: NewsArticle, requestedStatus?: 'published' | 'unpublished') => {
    if (!canPublish) {
      showLocalNotice('Permission Denied.', 'error');
      return;
    }
    const isCurrentlyPublished = article.status === 'published' || (!article.status && article.status !== 'draft');
    const newStatus: 'published' | 'unpublished' = requestedStatus || (isCurrentlyPublished ? 'unpublished' : 'published');
    const nowFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    try {
      const newsRef = doc(db, 'news', article.id);
      const updateData = cleanFirestoreData({
        ...article,
        status: newStatus,
        tag: newStatus === 'published' ? (article.tag === 'Draft' ? 'Official Bulletin' : article.tag || 'Official Bulletin') : (article.tag || 'Official Bulletin'),
        date: newStatus === 'published' ? (article.date || nowFormatted) : article.date,
        updatedAt: new Date().toISOString()
      });
      await setDoc(newsRef, updateData, { merge: true });

      try {
        const postsRef = doc(db, 'posts', article.id);
        await setDoc(postsRef, updateData, { merge: true });
      } catch {}

      try {
        await logAuditEvent({
          actorUid: currentUser?.uid || 'system',
          actorEmail: currentUser?.email || '',
          actorRole: activeRole || 'blog_admin',
          action: newStatus === 'published' ? 'BLOG_ARTICLE_PUBLISHED' : 'BLOG_ARTICLE_UNPUBLISHED',
          targetEntity: 'news',
          targetId: article.id,
          details: { title: article.title, status: newStatus }
        });
      } catch (auditErr) {
        console.warn('Audit log write handled (non-blocking):', auditErr);
      }

      showLocalNotice(
        newStatus === 'published'
          ? `"${article.title}" is now published and live on the website.`
          : `"${article.title}" deactivated and unpublished.`,
        newStatus === 'published' ? 'success' : 'info'
      );
    } catch (err: any) {
      console.error('Error updating status:', err);
      showLocalNotice(`Failed to update status: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  // Delete Article Trigger & In-App Execution (No window.confirm)
  const handleDeleteArticle = (id: string, artTitle: string) => {
    if (!canPublish) {
      showLocalNotice('Permission Denied.', 'error');
      return;
    }
    setDeleteConfirmArticle({ id, title: artTitle });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmArticle || !canPublish) return;
    setIsDeletingArticle(true);
    try {
      const newsRef = doc(db, 'news', deleteConfirmArticle.id);
      
      // Attempt hard deletion first; fall back to soft-delete if rules dictate
      try {
        await deleteDoc(newsRef);
      } catch {
        await setDoc(newsRef, { 
          id: deleteConfirmArticle.id,
          title: deleteConfirmArticle.title,
          status: 'deleted', 
          isDeleted: true,
          deletedAt: new Date().toISOString()
        }, { merge: true });
      }

      try {
        const postsRef = doc(db, 'posts', deleteConfirmArticle.id);
        await deleteDoc(postsRef).catch(async () => {
          await setDoc(postsRef, { 
            id: deleteConfirmArticle.id,
            title: deleteConfirmArticle.title,
            status: 'deleted', 
            isDeleted: true,
            deletedAt: new Date().toISOString()
          }, { merge: true });
        });
      } catch {}

      try {
        await logAuditEvent({
          actorUid: currentUser?.uid || 'system',
          actorEmail: currentUser?.email || '',
          actorRole: activeRole || 'blog_admin',
          action: 'BLOG_ARTICLE_DELETED',
          targetEntity: 'news',
          targetId: deleteConfirmArticle.id,
          details: { articleTitle: deleteConfirmArticle.title }
        });
      } catch (auditErr) {
        console.warn('Audit log write handled (non-blocking):', auditErr);
      }

      showLocalNotice(`Article "${deleteConfirmArticle.title}" deleted.`);
      setDeleteConfirmArticle(null);
    } catch (err: any) {
      console.error('Error deleting article:', err);
      showLocalNotice(`Failed to delete article: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsDeletingArticle(false);
    }
  };

  // Delegate / Revoke Blog Admin Role (Super Admin Only)
  const handleToggleBlogRole = async (targetUser: UserProfile) => {
    if (!isSuperAdmin) {
      showLocalNotice('Only Super Admin can delegate or revoke publishing permissions.');
      return;
    }

    setDelegatingUserId(targetUser.uid);
    const existingRoles = Array.isArray(targetUser.roles) ? [...targetUser.roles] : [targetUser.primaryRole || 'user'];
    const hasRole = existingRoles.includes('blog_admin');
    
    let updatedRoles: UserRole[];
    if (hasRole) {
      updatedRoles = existingRoles.filter(r => r !== 'blog_admin');
    } else {
      updatedRoles = Array.from(new Set([...existingRoles, 'blog_admin']));
    }

    try {
      const userDocRef = doc(db, 'users', targetUser.uid);
      const blogPermissions: AppPermission[] = [
        'blog.create',
        'blog.edit',
        'blog.publish',
        'press.publish',
        'news.publish',
        'news.edit',
        'trust.publish',
        'trust.edit',
        'bulletin.publish',
        'bulletin.edit',
        'content.publish'
      ];
      let updatedPermissions = Array.isArray(targetUser.permissions) ? [...targetUser.permissions] : [];
      if (hasRole) {
        updatedPermissions = updatedPermissions.filter(p => !blogPermissions.includes(p));
      } else {
        updatedPermissions = Array.from(new Set([...updatedPermissions, ...blogPermissions]));
      }

      await updateDoc(userDocRef, {
        roles: updatedRoles,
        permissions: updatedPermissions,
        customPermissions: updatedPermissions,
        updatedAt: serverTimestamp()
      });

      await logAuditEvent({
        actorUid: currentUser?.uid || 'system',
        actorEmail: currentUser?.email || '',
        actorRole: activeRole || 'super_admin',
        action: hasRole ? 'ROLE_REVOKED' : 'ROLE_ASSIGNED',
        targetEntity: 'users',
        targetId: targetUser.uid,
        details: {
          role: 'blog_admin',
          targetName: targetUser.fullName || targetUser.email,
          action: hasRole ? 'revoke' : 'assign'
        }
      });

      showLocalNotice(
        hasRole
          ? `Revoked blog publishing access from ${targetUser.fullName || targetUser.email}`
          : `Delegated blog publishing access to ${targetUser.fullName || targetUser.email}`
      );
    } catch (err: any) {
      console.error('Error modifying blog admin role:', err);
      showLocalNotice(`Failed to update role: ${err?.message || 'Unknown error'}`);
    } finally {
      setDelegatingUserId(null);
    }
  };

  // Filtered Articles
  const filteredArticles = articles.filter(art => {
    if (filterStatus !== 'all') {
      const artStatus = art.status || 'published';
      if (artStatus !== filterStatus) return false;
    }
    if (filterCategory !== 'all' && art.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchSummary = art.summary?.toLowerCase().includes(q);
      const matchCategory = art.category?.toLowerCase().includes(q);
      const matchTag = art.tag?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchCategory && !matchTag) return false;
    }
    return true;
  });

  // Delegated user lists
  const delegatedUsers = users.filter(u => u.roles?.includes('blog_admin'));
  const filteredUserSearch = users.filter(u => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobileNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6" id="admin-blog-console-full">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Official Blog, Press & Media Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized publication suite for press releases, circulars, announcements, and trust dispatches.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Super Admin Access Delegation Button */}
          {isSuperAdmin && (
            <button
              onClick={() => setIsDelegationModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              id="btn-delegate-blog-access"
              title="Delegate or revoke publishing permissions for registered users"
            >
              <UserPlus className="w-3.5 h-3.5 text-rose-600" />
              <span>Manage Publishing Rights ({delegatedUsers.length})</span>
            </button>
          )}

          {/* Publish New Bulletin Button */}
          {canCreate || canPublish ? (
            <button
              onClick={() => handleOpenEditor()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              id="btn-publish-bulletin"
            >
              <Plus className="w-4 h-4" />
              <span>{canPublish ? 'Publish New Bulletin' : 'Create Draft Bulletin'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Read-Only: Contact Super Admin for publishing delegation</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Delegation Banner (Shows active delegate badge if current user is delegated) */}
      {!isSuperAdmin && canOperateBlog && (
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-xs">
            <span className="font-extrabold text-rose-950">Delegated Blog Publisher Clearance Active: </span>
            <span className="text-rose-800">
              You have been granted official publishing authority by the FET India Super Administrator. You can draft, edit, and publish dispatches directly to the public website.
            </span>
          </div>
        </div>
      )}

      {/* Delegated Publishers Strip (Visible to Super Admin) */}
      {isSuperAdmin && delegatedUsers.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Currently Delegated Publishing Administrators ({delegatedUsers.length})
            </span>
            <button
              onClick={() => setIsDelegationModalOpen(true)}
              className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
            >
              Modify Delegations
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {delegatedUsers.map((u) => (
              <div 
                key={u.uid}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px]">
                  {(u.fullName || u.email || 'U')[0].toUpperCase()}
                </div>
                <span className="font-semibold">{u.fullName || u.email}</span>
                <button
                  onClick={() => handleToggleBlogRole(u)}
                  className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                  title="Revoke publishing rights"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles Management Table & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bulletins & dispatches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Tabs Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({articles.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('published')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterStatus === 'published'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>Published ({articles.filter(a => a.status === 'published' || (!a.status && a.status !== 'draft' && a.status !== 'unpublished')).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('draft')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterStatus === 'draft'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Drafts ({articles.filter(a => a.status === 'draft').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('unpublished')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterStatus === 'unpublished'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <EyeOff className="w-3 h-3 text-slate-500" />
                <span>Unpublished ({articles.filter(a => a.status === 'unpublished').length})</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Scholarship Alert">Scholarship Alerts</option>
                <option value="Examination">Examination</option>
                <option value="Research & Policy">Research & Policy</option>
                <option value="Healthcare & Welfare">Healthcare & Welfare</option>
                <option value="News & Announcements">News & Announcements</option>
                <option value="Official Circular">Official Circulars</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles List */}
        {isLoadingArticles ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
            <span>Loading trust editorial bulletins...</span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <Newspaper className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No articles matching search or filter criteria</p>
            <p className="text-[11px] text-slate-400 mt-1">Try resetting the status/category filter or search phrase.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {filteredArticles.map((art) => (
              <div 
                key={art.id} 
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Thumbnail if present */}
                  {art.imageUrl ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <img 
                        src={art.imageUrl} 
                        alt={art.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          // Hide on broken image
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
                      <Newspaper className="w-6 h-6 text-slate-300" />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* Status Badge */}
                      {art.status === 'draft' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" /> Draft
                        </span>
                      ) : art.status === 'unpublished' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-slate-500" /> Unpublished
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Published
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {art.category}
                      </span>
                      {art.tag && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          {art.tag}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {art.date}
                      </span>
                      {art.author && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" /> {art.author}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {art.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setPreviewArticle(art)}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="Preview Public Article"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Preview</span>
                  </button>

                  {canPublish && (
                    <>
                      {/* Quick Publish / Unpublish / Activate Action */}
                      {art.status === 'draft' ? (
                        <button
                          onClick={() => handleTogglePublishStatus(art, 'published')}
                          className="p-2 rounded-xl border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          title="Publish Draft to Website"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline text-[11px] font-bold">Publish</span>
                        </button>
                      ) : art.status === 'unpublished' ? (
                        <button
                          onClick={() => handleTogglePublishStatus(art, 'published')}
                          className="p-2 rounded-xl border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          title="Publish & Reactivate to Website"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline text-[11px] font-bold">Activate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTogglePublishStatus(art, 'unpublished')}
                          className="p-2 rounded-xl border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border-slate-200"
                          title="Deactivate and Unpublish"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline text-[11px]">Unpublish</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEditor(art)}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                        title="Edit Article"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline text-[11px]">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteArticle(art.id, art.title)}
                        className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer text-xs font-semibold"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* DELEGATION MODAL (SUPER ADMIN ONLY) */}
      {/* ============================================================== */}
      {isDelegationModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Delegate Blog & Media Publishing Access
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grant or revoke press bulletin publishing authority for registered trust users.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDelegationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search registered users */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered members by name, email, or mobile..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Users list with toggle buttons */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              {filteredUserSearch.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No users found.
                </div>
              ) : (
                filteredUserSearch.map((user) => {
                  const isDelegated = user.roles?.includes('blog_admin');
                  const isTargetProcessing = delegatingUserId === user.uid;

                  return (
                    <div 
                      key={user.uid}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {user.fullName || user.email || 'Anonymous User'}
                          </span>
                          {isDelegated && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                              Blog Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{user.email}</span>
                          {user.mobileNumber && <span>• {user.mobileNumber}</span>}
                          <span>• Primary Role: {user.primaryRole || 'user'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleBlogRole(user)}
                        disabled={isTargetProcessing}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          isDelegated
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                        }`}
                      >
                        {isTargetProcessing 
                          ? 'Updating...' 
                          : isDelegated 
                          ? 'Revoke Access' 
                          : 'Grant Publishing Rights'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDelegationModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ARTICLE EDITOR MODAL (PUBLISH / EDIT) */}
      {/* ============================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-rose-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {editingArticleId 
                    ? (editingArticleStatus === 'draft' ? 'Edit Editorial Draft' : 'Edit Published Bulletin') 
                    : 'Publish New Trust Bulletin'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Article Headline / Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Merit Scholarship 2026-27: Final Allocation List Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              {/* Grid: Category & Tag & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="News & Announcements">News & Announcements</option>
                    <option value="Scholarship Alert">Scholarship Alert</option>
                    <option value="Examination">Examination</option>
                    <option value="Research & Policy">Research & Policy</option>
                    <option value="Healthcare & Welfare">Healthcare & Welfare</option>
                    <option value="Official Circular">Official Circular</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Official Dispatch"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 min read"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* IMAGE SOURCE OPTIONS (UPLOAD IMAGE OR IMAGE URL / LINK) */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs">
                      Cover Image (Optional)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose to upload an image file or provide a direct image link
                    </p>
                  </div>

                  {/* Mode Selector Tabs: Upload Image vs. Image URL / Link */}
                  <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceMode('upload');
                        setImageError(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageSourceMode === 'upload'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      id="btn-blog-image-mode-upload"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceMode('url');
                        setImageError(null);
                        if (imageUrl && !urlInputValue) {
                          setUrlInputValue(imageUrl);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageSourceMode === 'url'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      id="btn-blog-image-mode-url"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Image URL / Link</span>
                    </button>
                  </div>
                </div>

                {imageError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Option A: Upload Image */}
                {imageSourceMode === 'upload' && (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageFileSelect}
                      className="hidden"
                      id="blog-image-file-input"
                    />

                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => !isImageUploading && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        isImageUploading
                          ? 'border-rose-300 bg-rose-50/50 cursor-not-allowed'
                          : 'border-slate-300 hover:border-rose-500 bg-white hover:bg-rose-50/20'
                      }`}
                    >
                      {isImageUploading ? (
                        <div className="space-y-2 py-2">
                          <Loader2 className="w-6 h-6 text-rose-600 animate-spin mx-auto" />
                          <p className="text-xs font-bold text-slate-800">
                            Compressing and uploading image ({imageUploadProgress}%)...
                          </p>
                          <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                            <div
                              className="h-full bg-rose-600 transition-all duration-300"
                              style={{ width: `${imageUploadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-rose-600 hover:text-rose-700">
                              Click to browse image
                            </span>
                            <span className="text-xs text-slate-500"> or drag and drop image file</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            JPG, PNG, or WebP up to 10MB (automatically compressed for web speed)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Option B: Image URL / Link */}
                {imageSourceMode === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/photo-... or https://example.com/press.jpg"
                          value={urlInputValue}
                          onChange={(e) => handleUrlInputChange(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                        />
                      </div>
                      {urlInputValue && (
                        <button
                          type="button"
                          onClick={() => {
                            handleUrlInputChange(urlInputValue);
                            if (urlInputValue.trim()) {
                              showLocalNotice('Image URL applied');
                            }
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Apply URL
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Paste a direct, accessible image web address (must begin with http:// or https://)
                    </p>
                  </div>
                )}

                {/* Attached Image Preview & Management */}
                {imageUrl && (
                  <div className="mt-3 p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                        <img
                          src={imageUrl}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => {
                            setImageError('Preview failed to load. The image link may be private, expired, or invalid.');
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            Cover Image Attached
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate max-w-[280px] sm:max-w-md font-mono">
                          {uploadedFileName ? `File: ${uploadedFileName}` : imageUrl}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                      title="Remove cover image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Summary / Excerpt */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Brief Summary / Excerpt <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="A concise 1-2 sentence overview shown in article listings and social previews..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Full Article Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Dispatch Content / Body
                </label>
                <textarea
                  rows={8}
                  placeholder="Write the complete announcement or dispatch text here. Paragraphs and bullet points are preserved..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveArticle('draft')}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {editingArticleId && editingArticleStatus === 'draft' 
                      ? 'Save Draft' 
                      : editingArticleId && editingArticleStatus === 'published' 
                      ? 'Revert to Draft' 
                      : 'Save as Draft'}
                  </span>
                </button>

                {editingArticleId && editingArticleStatus === 'published' && (
                  <button
                    type="button"
                    onClick={() => handleSaveArticle('unpublished')}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer flex items-center gap-1.5 text-amber-900"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                    <span>Unpublish (Deactivate)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveArticle('published')}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSaving 
                      ? 'Publishing...' 
                      : (editingArticleId && editingArticleStatus === 'published' ? 'Update & Keep Live' : 'Publish to Website')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL (IN-APP) */}
      {/* ============================================================== */}
      {deleteConfirmArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Permanently Delete Bulletin?</h3>
                <p className="text-xs text-slate-500">This action will remove the article from the website permanently.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-800 line-clamp-2">
                "{deleteConfirmArticle.title}"
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmArticle(null)}
                disabled={isDeletingArticle}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeletingArticle}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isDeletingArticle ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingArticle ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ARTICLE PREVIEW MODAL */}
      {/* ============================================================== */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                  {previewArticle.category} • {previewArticle.tag}
                </span>
                {previewArticle.status === 'draft' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    Draft
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Live
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewArticle.imageUrl && (
              <img 
                src={previewArticle.imageUrl} 
                alt={previewArticle.title} 
                className="w-full h-48 object-cover rounded-2xl border border-slate-200"
              />
            )}

            <h3 className="text-lg font-black text-slate-900 leading-snug">
              {previewArticle.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-500 border-y border-slate-100 py-2">
              <span>Author: <strong>{previewArticle.author}</strong></span>
              <span>•</span>
              <span>Published: {previewArticle.date}</span>
              <span>•</span>
              <span>{previewArticle.readTime}</span>
            </div>

            <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {previewArticle.summary}
            </p>

            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {previewArticle.content || previewArticle.summary}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
