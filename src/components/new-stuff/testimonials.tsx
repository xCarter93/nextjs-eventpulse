import React from "react";
import { Card, CardBody, Avatar } from "@heroui/react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export const Testimonials = () => {
  const testimonials = [
    {
      content: "EventPulse has transformed how we manage our corporate events. The email template editor saves us hours of design work, and the automated reminders have significantly increased our attendance rates.",
      author: "Sarah Johnson",
      role: "Event Manager, TechCorp",
      avatar: 5
    },
    {
      content: "As a conference organizer, I need reliable tools that scale. EventPulse handles our 5,000+ attendee events flawlessly, and the contact management system makes personalized communication simple.",
      author: "Michael Chen",
      role: "Conference Director, InnovateX",
      avatar: 6
    },
    {
      content: "The drag-and-drop email editor is a game-changer. We've created stunning event invitations that have doubled our open rates compared to our previous platform.",
      author: "Jessica Rodriguez",
      role: "Marketing Director, CreativeEvents",
      avatar: 7
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Event Professionals
          </h2>
          <p className="text-lg text-foreground-600">
            See what our customers have to say about how EventPulse has improved their event management process.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full border border-divider">
                <CardBody className="p-6">
                  <Icon icon="lucide:quote" className="text-primary text-3xl mb-4" />
                  <p className="text-foreground-600 mb-6">{testimonial.content}</p>
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={`https://img.heroui.chat/image/avatar?w=64&h=64&u=${testimonial.avatar}`} 
                      size="md"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.author}</h4>
                      <p className="text-sm text-foreground-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};