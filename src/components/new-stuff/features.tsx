import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export const Features = () => {
  const features = [
    {
      icon: "lucide:users",
      title: "Contact Management",
      description: "Easily add, organize, and manage your contacts with custom tags and groups for targeted event invitations."
    },
    {
      icon: "lucide:calendar",
      title: "Custom Events",
      description: "Create and customize events with detailed information, registration forms, and personalized attendee experiences."
    },
    {
      icon: "lucide:bell",
      title: "Email Reminders",
      description: "Set up automated email reminders to keep your attendees informed about upcoming events and important updates."
    },
    {
      icon: "lucide:mail",
      title: "Email Template Editor",
      description: "Design beautiful, responsive email templates with our intuitive drag-and-drop editor—no coding required."
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
    <section id="features" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Manage Events Effectively
          </h2>
          <p className="text-lg text-foreground-600">
            EventPulse provides powerful tools to streamline your event planning process from start to finish.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full border border-divider">
                <CardBody className="p-6">
                  <div className="rounded-full bg-primary-100 p-3 w-12 h-12 flex items-center justify-center mb-5">
                    <Icon icon={feature.icon} className="text-primary text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-foreground-600">{feature.description}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};