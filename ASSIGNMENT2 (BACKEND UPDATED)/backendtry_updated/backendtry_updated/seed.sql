-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS news_editor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE news_editor;

-- Drop existing table (caution: this will delete all existing data!)
DROP TABLE IF EXISTS documents;

-- Create the documents table with image_url column
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT DEFAULT NULL,
    details TEXT DEFAULT NULL,
    category ENUM('research', 'collaboration', 'award', 'talk', 'workshop') NOT NULL DEFAULT 'research',
    display_date DATE DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Preloaded data so it's not empty when first entering the site

INSERT INTO documents (title, content, details, category, display_date, image_url) VALUES
(
    'Best Paper Award at HCI International 2024',
    'Received the Best Paper Award at the International Conference on Human-Computer Interaction for outstanding research in emotion-aware interface design.',
    'The paper titled "Emotion-Responsive Adaptive Interfaces: A Novel Approach to Personalized User Experience" was presented at HCI International 2024 held in Copenhagen, Denmark. The research introduces a framework for real-time emotion detection and adaptive UI response, demonstrating significant improvements in user satisfaction and task completion rates across multiple domains including e-learning, healthcare, and e-commerce. The award was presented during the closing ceremony, recognizing the contribution to advancing human-computer interaction methodologies. The research team included collaborators from Loughborough University and Universiti Kebangsaan Malaysia.',
    'award',
    '2024-07-15',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop'
),
(
    'Invited Keynote at IEEE International Conference on Multimedia',
    'Delivered a keynote address on "The Future of Multimodal Interaction in AI-Driven Systems" at the IEEE ICME 2024 conference.',
    'The keynote presentation explored the convergence of computer vision, natural language processing, and emotion recognition in creating next-generation interactive systems. Key topics included the role of large language models in HCI, ethical considerations in affective computing, and the potential of multimodal AI to transform education and healthcare. The talk was attended by over 500 researchers and practitioners from 30+ countries, sparking discussions on the future direction of HCI research in the era of generative AI.',
    'talk',
    '2024-06-20',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=400&fit=crop'
),
(
    'New Research Collaboration with Guangzhou KEO',
    'Signed a memorandum of understanding with Guangzhou KEO for joint research in computer vision applications for smart campus environments.',
    'This collaboration aims to develop intelligent surveillance and monitoring systems for university campuses, leveraging advanced computer vision and deep learning techniques. The project will focus on crowd analysis, safety monitoring, and energy optimization through visual data. The partnership includes exchange programs for postgraduate students, joint publications, and shared access to research facilities. Initial funding of RM 500,000 has been secured for the first phase of the project, which is expected to run for two years.',
    'collaboration',
    '2024-05-10',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop'
),
(
    'Workshop on UX Research Methods for Postgraduate Students',
    'Organized a two-day intensive workshop on advanced UX research methodologies for postgraduate students at the Faculty of Computing, UTM.',
    'The workshop covered qualitative and quantitative research methods including contextual inquiry, think-aloud protocols, eye-tracking studies, and large-scale usability testing. Over 40 postgraduate students participated in hands-on sessions where they designed and conducted mini research studies. Guest facilitators from Infinite Loop Media provided industry perspectives on UX research in commercial settings. Participants received certificates and the workshop materials have been made available through the UTM learning management system.',
    'workshop',
    '2024-04-05',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop'
),
(
    'New Publication in Computers & Education Journal',
    'Published a research article titled "AI-Powered Adaptive Learning Systems: Evaluating Effectiveness in Malaysian Higher Education" in the prestigious Computers & Education journal.',
    'The paper presents findings from a year-long study evaluating the effectiveness of AI-powered adaptive learning systems in Malaysian universities. Using a mixed-methods approach with over 800 student participants across three universities, the research found that adaptive learning systems significantly improved student engagement and learning outcomes, particularly in STEM subjects. The study also identified key challenges in implementation, including faculty resistance, infrastructure limitations, and the need for culturally relevant content adaptation. The publication has already garnered 15 citations within three months of publication.',
    'research',
    '2024-03-18',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop'
),
(
    'Appointment as Deputy Director of Digital Media',
    'Officially appointed as the Deputy Director (Digital Media) at Universiti Teknologi Malaysia, overseeing the university digital transformation initiatives.',
    'In this new role, the responsibilities include developing and implementing the university digital media strategy, managing multimedia content production, leading the UTM web and mobile application development teams, and coordinating digital communication across all faculties and departments. Key priorities for the first year include launching the new UTM website, implementing a centralized content management system, and establishing digital accessibility standards across all university platforms. The appointment reflects the university commitment to strengthening its digital presence and innovation capabilities.',
    'award',
    '2024-02-01',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop'
);

-- Verify the seed data
SELECT id, title, category, display_date, LEFT(image_url, 50) as image_preview FROM documents;
